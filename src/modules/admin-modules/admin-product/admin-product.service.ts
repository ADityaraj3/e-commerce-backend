import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { AddProductDto } from './dto/add-product.dto';

interface VariantToProcess {
  sku: string;
  product_id: string;
  price: number;
  discount?: number;
  discounted_price?: number;
  description: string;
  stock_quantity: number;
  created_by: string;
  updated_by: string;
  attributes: { attribute_id: string; attribute_value: string }[];
  media_id: string | null;
}

@Injectable()
export class AdminProductService {
  constructor(private readonly prisma: PrismaService) {}

  async addProduct(addProduct: AddProductDto, userId: string) {
    try {
      // ---------------------------------------------------------
      // 1. Check if product already exists (by name + category)
      // ---------------------------------------------------------
      let product = await this.prisma.product.findFirst({
        where: {
          product_name: {
            equals: addProduct.product_name,
            mode: 'insensitive', // Case-insensitive match
          },
          category_id: addProduct.category_id,
          is_active: true,
        },
      });

      let isNewProduct = false;

      if (product) {
        // Product exists - optionally update some fields
        product = await this.prisma.product.update({
          where: { product_id: product.product_id },
          data: {
            // Update fields that might have changed
            is_new_arrival:
              addProduct.is_new_arrival ?? product.is_new_arrival,
            is_product_refundable:
              addProduct.is_product_refundable ?? product.is_product_refundable,
            description: addProduct.description ?? product.description,
            updated_by: userId,
            updated_at: new Date(),
          },
        });
      } else {
        // Create new product
        isNewProduct = true;
        product = await this.prisma.product.create({
          data: {
            category_id: addProduct.category_id,
            product_name: addProduct.product_name,
            is_new_arrival: addProduct.is_new_arrival,
            stock_quantity: addProduct.stock_quantity,
            is_product_refundable: addProduct.is_product_refundable,
            description: addProduct.description,
            created_by: userId,
            updated_by: userId,
          },
        });
      }

      // ---------------------------------------------------------
      // 2. Prepare Variants — Auto vs Manual
      // ---------------------------------------------------------

      let variantsToProcess: VariantToProcess[] = [];

      // AUTO-GENERATE MODE
      if (addProduct.auto_generate && addProduct.attributes?.length > 0) {
        const attributeValues = addProduct.attributes.map((a) => a.values);

        const combinations = this.cartesian(attributeValues); // CALL HELPER

        combinations.forEach((combo) => {
          const attributes = combo.map((value, i) => ({
            attribute_id: addProduct.attributes[i].attribute_id,
            attribute_value: value,
          }));

          const sku = this.generateSKU(addProduct.product_name, combo);

          variantsToProcess.push({
            sku,
            product_id: product.product_id,
            price: addProduct.price,
            discount: addProduct.discount,
            discounted_price: addProduct.discounted_price,
            description: addProduct.description,
            stock_quantity: addProduct.stock_quantity ?? 0,
            created_by: userId,
            updated_by: userId,
            attributes,
            media_id: null,
          });
        });
      }

      // MANUAL VARIANT MODE
      if (!addProduct.auto_generate && addProduct.product_variants?.length > 0) {
        variantsToProcess = addProduct.product_variants.map((v) => ({
          product_id: product.product_id,
          sku:
            v.sku ??
            this.generateSKU(
              addProduct.product_name,
              v.attributes.map((a) => a.attribute_value),
            ),
          price: v.price,
          discount: v.discount,
          discounted_price: v.discounted_price,
          description: v.description,
          stock_quantity: v.stock_quantity,
          created_by: userId,
          updated_by: userId,
          attributes: v.attributes,
          media_id: v.media_id ?? null,
        }));
      }

      if (variantsToProcess.length === 0) {
        return {
          message: isNewProduct
            ? 'Product created successfully'
            : 'Product already exists (no variants to add)',
          product_id: product.product_id,
          is_new_product: isNewProduct,
        };
      }

      // ---------------------------------------------------------
      // 3. Check for existing variants and separate into create/update
      // ---------------------------------------------------------
      const { variantsToCreate, variantsToUpdate } =
        await this.separateExistingVariants(
          variantsToProcess,
          product.product_id,
        );

      // ---------------------------------------------------------
      // 4. Update existing variants (add stock quantity)
      // ---------------------------------------------------------
      for (const variant of variantsToUpdate) {
        await this.prisma.productVariant.update({
          where: { product_variant_id: variant.existingVariantId },
          data: {
            stock_quantity: {
              increment: variant.stock_quantity,
            },
            updated_by: userId,
            updated_at: new Date(),
          },
        });
      }

      // ---------------------------------------------------------
      // 5. Insert new variants to DB
      // ---------------------------------------------------------
      if (variantsToCreate.length > 0) {
        await this.prisma.productVariant.createMany({
          data: variantsToCreate.map((v) => ({
            product_id: v.product_id,
            sku: v.sku,
            price: v.price,
            discount: v.discount,
            discounted_price: v.discounted_price,
            description: v.description,
            stock_quantity: v.stock_quantity,
            created_by: v.created_by,
            updated_by: v.updated_by,
          })),
        });

        // Fetch variant IDs for newly created variants
        const createdVariants = await this.prisma.productVariant.findMany({
          where: {
            product_id: product.product_id,
            sku: { in: variantsToCreate.map((v) => v.sku) },
          },
        });

        const skuToId = new Map(
          createdVariants.map((v) => [v.sku, v.product_variant_id]),
        );

        // ---------------------------------------------------------
        // 6. Insert variant attributes for new variants
        // ---------------------------------------------------------
        const attributesInsert = variantsToCreate.flatMap((v) =>
          v.attributes.map((a) => ({
            product_variant_id: skuToId.get(v.sku)!,
            attribute_id: a.attribute_id,
            attribute_value: a.attribute_value,
            created_by: userId,
            updated_by: userId,
          })),
        );

        await this.prisma.variantAttribute.createMany({ data: attributesInsert });

        // ---------------------------------------------------------
        // 7. Insert variant media for new variants
        // ---------------------------------------------------------
        const mediaInsert = variantsToCreate
          .filter((v) => v.media_id)
          .map((v) => ({
            product_variant_id: skuToId.get(v.sku)!,
            media_id: v.media_id!,
          }));

        if (mediaInsert.length > 0) {
          await this.prisma.productVariantMedia.createMany({ data: mediaInsert });
        }
      }

      // Build response message
      const createdCount = variantsToCreate.length;
      const updatedCount = variantsToUpdate.length;
      const productStatus = isNewProduct ? 'created' : 'found (existing)';
      let message = `Product ${productStatus}`;

      if (createdCount > 0 && updatedCount > 0) {
        message = `Product ${productStatus} with ${createdCount} new variant(s) added and ${updatedCount} existing variant(s) updated with additional stock`;
      } else if (createdCount > 0) {
        message = `Product ${productStatus} with ${createdCount} variant(s) added successfully`;
      } else if (updatedCount > 0) {
        message = `Product ${productStatus} and stock added to ${updatedCount} existing variant(s)`;
      }

      return {
        message,
        product_id: product.product_id,
        is_new_product: isNewProduct,
        variants_created: createdCount,
        variants_updated: updatedCount,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Check if variants already exist by matching attributes
   * Returns variants to create and variants to update
   */
  private async separateExistingVariants(
    variantsToProcess: VariantToProcess[],
    productId: string,
  ): Promise<{
    variantsToCreate: VariantToProcess[];
    variantsToUpdate: (VariantToProcess & { existingVariantId: string })[];
  }> {
    const variantsToCreate: VariantToProcess[] = [];
    const variantsToUpdate: (VariantToProcess & { existingVariantId: string })[] =
      [];

    // Get all existing variants for this product with their attributes
    const existingVariants = await this.prisma.productVariant.findMany({
      where: { product_id: productId },
      include: {
        variant_attribute: {
          select: {
            attribute_id: true,
            attribute_value: true,
          },
        },
      },
    });

    for (const variant of variantsToProcess) {
      // Generate attribute signature for comparison
      const newAttributeSignature = this.generateAttributeSignature(
        variant.attributes,
      );

      // Find existing variant with matching attributes
      const existingVariant = existingVariants.find((ev) => {
        const existingSignature = this.generateAttributeSignature(
          ev.variant_attribute.map((va) => ({
            attribute_id: va.attribute_id || '',
            attribute_value: va.attribute_value || '',
          })),
        );
        return existingSignature === newAttributeSignature;
      });

      if (existingVariant) {
        // Variant with same attributes exists - add to update list
        variantsToUpdate.push({
          ...variant,
          existingVariantId: existingVariant.product_variant_id,
        });
      } else {
        // New variant - add to create list
        variantsToCreate.push(variant);
      }
    }

    return { variantsToCreate, variantsToUpdate };
  }

  /**
   * Generate a unique signature from attributes for comparison
   * Sorts attributes to ensure consistent ordering
   */
  private generateAttributeSignature(
    attributes: { attribute_id: string; attribute_value: string }[],
  ): string {
    return attributes
      .map((a) => `${a.attribute_id}:${a.attribute_value.toLowerCase().trim()}`)
      .sort()
      .join('|');
  }

  // ---------------------------------------------------------
  // CARTESIAN PRODUCT HELPER
  // ---------------------------------------------------------
  private cartesian(arr: any[]) {
    return arr.reduce(
      (a, b) => a.flatMap(x => b.map(y => [...x, y])),
      [[]],
    );
  }

  // ---------------------------------------------------------
  // SKU GENERATOR
  // ---------------------------------------------------------
  private generateSKU(name: string, values: string[]) {
    const code = name.replace(/\s+/g, '').substring(0, 4).toUpperCase();
    return `${code}-${values.map(v => v.substring(0, 3).toUpperCase()).join('-')}-${Date.now().toString().slice(-4)}`;
  }
}
