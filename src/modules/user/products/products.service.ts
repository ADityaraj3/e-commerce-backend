import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';

interface ProductFilter {
  category_id?: string;
  is_new_arrival?: boolean;
  limit?: number;
  offset?: number;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async getAllProducts(filters: ProductFilter) {
    try {
      const where: any = {
        is_active: true,
      };

      if (filters.category_id) {
        where.category_id = filters.category_id;
      }

      if (filters.is_new_arrival !== undefined) {
        where.is_new_arrival = filters.is_new_arrival;
      }

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          include: {
            categories: {
              select: {
                category_id: true,
                category_name: true,
              },
            },
            product_variants: {
              where: {
                is_active: true,
              },
              include: {
                product_variant_media: {
                  include: {
                    media: true,
                  },
                },
                variant_attribute: {
                  include: {
                    category_attributes: {
                      select: {
                        attribute_name: true,
                      },
                    },
                  },
                },
              },
            },
          },
          skip: filters.offset,
          take: filters.limit,
          orderBy: {
            created_at: 'desc',
          },
        }),
        this.prisma.product.count({ where }),
      ]);

      return {
        products: products.map((product) => this.formatProduct(product)),
        total,
        limit: filters.limit,
        offset: filters.offset,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getProductById(productId: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: {
          product_id: productId,
          is_active: true,
        },
        include: {
          categories: {
            select: {
              category_id: true,
              category_name: true,
            },
          },
          product_variants: {
            where: {
              is_active: true,
            },
            include: {
              product_variant_media: {
                include: {
                  media: true,
                },
              },
              variant_attribute: {
                include: {
                  category_attributes: {
                    select: {
                      attribute_name: true,
                    },
                  },
                },
              },
            },
          },
          reviews: {
            include: {
              customers: {
                select: {
                  first_name: true,
                  last_name: true,
                },
              },
              review_media: {
                include: {
                  media: true,
                },
              },
            },
            orderBy: {
              created_at: 'desc',
            },
          },
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return this.formatProduct(product);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getProductBySlug(slug: string) {
    try {
      // Convert slug to product name (replace hyphens with spaces)
      const productName = slug.split('-').join(' ');
      
      const product = await this.prisma.product.findFirst({
        where: {
          product_name: {
            equals: productName,
            mode: 'insensitive',
          },
          is_active: true,
        },
        include: {
          categories: {
            select: {
              category_id: true,
              category_name: true,
            },
          },
          product_variants: {
            where: {
              is_active: true,
            },
            include: {
              product_variant_media: {
                include: {
                  media: true,
                },
              },
              variant_attribute: {
                include: {
                  category_attributes: {
                    select: {
                      attribute_name: true,
                    },
                  },
                },
              },
            },
          },
          reviews: {
            include: {
              customers: {
                select: {
                  first_name: true,
                  last_name: true,
                },
              },
              review_media: {
                include: {
                  media: true,
                },
              },
            },
            orderBy: {
              created_at: 'desc',
            },
          },
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return this.formatProduct(product);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getProductsByCategory(
    categoryId: string,
    options: { limit?: number; offset?: number },
  ) {
    try {
      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where: {
            category_id: categoryId,
            is_active: true,
          },
          include: {
            categories: {
              select: {
                category_id: true,
                category_name: true,
              },
            },
            product_variants: {
              where: {
                is_active: true,
              },
              include: {
                product_variant_media: {
                  include: {
                    media: true,
                  },
                },
                variant_attribute: {
                  include: {
                    category_attributes: {
                      select: {
                        attribute_name: true,
                      },
                    },
                  },
                },
              },
            },
          },
          skip: options.offset,
          take: options.limit,
          orderBy: {
            created_at: 'desc',
          },
        }),
        this.prisma.product.count({
          where: {
            category_id: categoryId,
            is_active: true,
          },
        }),
      ]);

      return {
        products: products.map((product) => this.formatProduct(product)),
        total,
        limit: options.limit,
        offset: options.offset,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getFeaturedProducts(limit: number = 10) {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          is_active: true,
          is_new_arrival: true,
        },
        include: {
          categories: {
            select: {
              category_id: true,
              category_name: true,
            },
          },
          product_variants: {
            where: {
              is_active: true,
            },
            include: {
              product_variant_media: {
                include: {
                  media: true,
                },
              },
              variant_attribute: {
                include: {
                  category_attributes: {
                    select: {
                      attribute_name: true,
                    },
                  },
                },
              },
            },
          },
        },
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      });

      return products.map((product) => this.formatProduct(product));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private formatProduct(product: any) {
    const firstVariant = product.product_variants?.[0];
    const images = firstVariant?.product_variant_media?.map((pvm: any) => pvm.media?.file_path) || [];

    return {
      id: product.product_id,
      name: product.product_name,
      slug: product.product_name.toLowerCase().replace(/\s+/g, '-'),
      description: product.description,
      price: firstVariant?.price || product.price || 0,
      discountedPrice: firstVariant?.discounted_price || product.discounted_price,
      discount: firstVariant?.discount || product.discount,
      stockQuantity: product.stock_quantity,
      isNewArrival: product.is_new_arrival,
      isRefundable: product.is_product_refundable,
      category: product.categories,
      images,
      variants: product.product_variants?.map((variant: any) => ({
        id: variant.product_variant_id,
        sku: variant.sku,
        price: variant.price,
        discountedPrice: variant.discounted_price,
        discount: variant.discount,
        stockQuantity: variant.stock_quantity,
        description: variant.description,
        images: variant.product_variant_media?.map((pvm: any) => pvm.media?.file_path) || [],
        attributes: variant.variant_attribute?.map((va: any) => ({
          name: va.category_attributes?.attribute_name,
          value: va.attribute_value,
        })) || [],
      })) || [],
      reviews: product.reviews?.map((review: any) => ({
        id: review.review_id,
        rating: review.rating,
        title: review.title,
        text: review.review_text,
        customer: {
          name: `${review.customers?.first_name} ${review.customers?.last_name}`,
        },
        images: review.review_media?.map((rm: any) => rm.media?.file_path) || [],
        createdAt: review.created_at,
      })) || [],
      rating: this.calculateAverageRating(product.reviews),
      reviewCount: product.reviews?.length || 0,
    };
  }

  private calculateAverageRating(reviews: any[]): number {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }
}
