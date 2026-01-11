import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import {
  ParseProductTextDto,
  ParsedProductResponseDto,
  ConfirmProductCreationDto,
  ProductCreationResponseDto,
  MissingCategoryDto,
  MissingAttributeDto,
} from './dto/ai-product-parser.dto';
import { AdminProductService } from './admin-product.service';
import { v4 as uuidv4 } from 'uuid';
import {
  AIProvider,
  callAI,
  listGeminiModels,
} from 'src/utils/helper.utils';

interface CategoryWithAttributes {
  category_id: string;
  category_name: string;
  parent_id: string | null;
  parent_name?: string;
  attributes: {
    attribute_id: string;
    attribute_name: string;
    attribute_type: string;
  }[];
}

interface AIResponse {
  product_data?: {
    category_name: string;
    product_name: string;
    is_new_arrival?: boolean;
    price?: number;
    discount?: number;
    discounted_price?: number;
    stock_quantity?: number;
    is_product_refundable?: boolean;
    description?: string;
    auto_generate?: boolean;
    attributes?: {
      attribute_name: string;
      values: string[];
    }[];
    product_variants?: {
      price: number;
      discount?: number;
      discounted_price?: number;
      description: string;
      sku?: string;
      attributes: {
        attribute_name: string;
        attribute_value: string;
      }[];
      stock_quantity: number;
    }[];
  };
  missing_categories?: {
    category_name: string;
    parent_category_name?: string;
  }[];
  missing_attributes?: {
    attribute_name: string;
    category_name: string;
    attribute_type: string;
  }[];
  message?: string;
  error?: string;
}

// In-memory session store (in production, use Redis or database)
const sessionStore = new Map<string, AIResponse>();

@Injectable()
export class AiProductParserService {
  private readonly openaiApiKey: string;
  private readonly geminiApiKey: string;
  private readonly groqApiKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly adminProductService: AdminProductService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    this.groqApiKey = this.configService.get<string>('GROQ_API_KEY') || '';
  }

  /**
   * API 1: Parse plain English text and return structured product JSON
   */
  async parseProductText(
    dto: ParseProductTextDto,
    userId: string,
  ): Promise<ParsedProductResponseDto> {
    try {
      // Step 1: Fetch all categories with their attributes
      const categoriesWithAttributes = await this.getCategoriesWithAttributes();

      // Step 2: Build the prompt for AI
      const prompt = this.buildAIPrompt(dto.text, categoriesWithAttributes);

      // Step 3: Determine AI provider and get API key
      const aiProvider = dto.ai_provider || AIProvider.GROQ;
      const apiKey = this.getApiKeyForProvider(aiProvider);

      if (!apiKey) {
        throw new BadRequestException(
          `${aiProvider.toUpperCase()} API key not configured. Please set ${aiProvider.toUpperCase()}_API_KEY in environment variables.`,
        );
      }

      // Step 3: Call AI API using helper function
      // Use higher max_tokens for complex product data
      const aiResponse = await this.callAIWithProvider(
        aiProvider,
        prompt,
        apiKey,
        dto.ai_model,
        0.3, // temperature
        4000, // maxTokens - increased for larger JSON responses
      );

      // Step 4: Process AI response and validate against database
      const processedResponse = await this.processAIResponse(
        aiResponse,
        categoriesWithAttributes,
      );

      // Step 5: Generate session ID and store response
      const sessionId = uuidv4();
      sessionStore.set(sessionId, processedResponse);

      // Auto-expire session after 30 minutes
      setTimeout(
        () => {
          sessionStore.delete(sessionId);
        },
        30 * 60 * 1000,
      );

      // Step 6: Build response
      const hasMissingEntities =
        (processedResponse.missing_categories?.length ?? 0) > 0 ||
        (processedResponse.missing_attributes?.length ?? 0) > 0;

      // Transform attribute names to IDs if category exists
      const productDataWithIds = processedResponse.product_data
        ? await this.transformToProductDto(
            processedResponse.product_data,
            categoriesWithAttributes,
          )
        : undefined;

      return {
        success: !processedResponse.error,
        product_data: productDataWithIds,
        missing_categories: processedResponse.missing_categories,
        missing_attributes: processedResponse.missing_attributes,
        message: hasMissingEntities
          ? this.buildMissingEntitiesMessage(
              processedResponse.missing_categories,
              processedResponse.missing_attributes,
            )
          : processedResponse.message || 'Product parsed successfully',
        requires_confirmation: hasMissingEntities,
        original_text: dto.text,
        session_id: sessionId,
      };
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Failed to parse product text',
      );
    }
  }

  /**
   * API 2: Confirm and create product (with optional missing entity creation)
   */
  async confirmAndCreateProduct(
    dto: ConfirmProductCreationDto,
    userId: string,
  ): Promise<ProductCreationResponseDto> {
    try {
      const createdCategoryIds: string[] = [];
      const createdAttributeIds: string[] = [];

      // Step 1: Create missing categories if requested
      if (dto.create_missing_entities && dto.missing_categories?.length) {
        for (const missingCategory of dto.missing_categories) {
          const categoryId = await this.createCategory(missingCategory, userId);
          createdCategoryIds.push(categoryId);
        }
      }

      // Step 2: Create missing attributes if requested
      if (dto.create_missing_entities && dto.missing_attributes?.length) {
        for (const missingAttribute of dto.missing_attributes) {
          const attributeId = await this.createAttribute(
            missingAttribute,
            userId,
          );
          createdAttributeIds.push(attributeId);
        }
      }

      // Step 3: Re-fetch categories to get updated IDs
      const categoriesWithAttributes = await this.getCategoriesWithAttributes();

      // Step 4: Transform product data with actual IDs
      const productDto = await this.transformToProductDtoWithIds(
        dto.product_data,
        categoriesWithAttributes,
      );

      // Step 5: Create product using existing service
      const result = await this.adminProductService.addProduct(
        productDto,
        userId,
      );

      // Clear session
      sessionStore.delete(dto.session_id);

      return {
        success: true,
        message: result.message,
        product_id: result.product_id,
        created_category_ids:
          createdCategoryIds.length > 0 ? createdCategoryIds : undefined,
        created_attribute_ids:
          createdAttributeIds.length > 0 ? createdAttributeIds : undefined,
      };
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Failed to create product',
      );
    }
  }

  /**
   * Fetch all categories with their attributes from database
   * Includes inherited attributes from parent categories
   */
  private async getCategoriesWithAttributes(): Promise<
    CategoryWithAttributes[]
  > {
    const categories = await this.prisma.category.findMany({
      where: { is_archived: false },
      select: {
        category_id: true,
        category_name: true,
        parent_id: true,
      },
    });

    // Create a map of category IDs to names for parent lookup
    const categoryIdToName = new Map<string, string>();
    const categoryIdToParent = new Map<string, string | null>();
    categories.forEach((cat) => {
      categoryIdToName.set(cat.category_id, cat.category_name ?? '');
      categoryIdToParent.set(cat.category_id, cat.parent_id);
    });

    // Fetch all attributes
    const allAttributes = await this.prisma.categoryAttribute.findMany({
      where: { is_archived: false },
      select: {
        attribute_id: true,
        attribute_name: true,
        attribute_type: true,
        category_id: true,
      },
    });

    // Create a map of category_id to its direct attributes
    const categoryIdToAttributes = new Map<
      string,
      { attribute_id: string; attribute_name: string; attribute_type: string }[]
    >();
    allAttributes.forEach((attr) => {
      if (attr.category_id) {
        const existing = categoryIdToAttributes.get(attr.category_id) || [];
        existing.push({
          attribute_id: attr.attribute_id,
          attribute_name: attr.attribute_name ?? '',
          attribute_type: attr.attribute_type ?? 'text',
        });
        categoryIdToAttributes.set(attr.category_id, existing);
      }
    });

    // Build categories with inherited attributes (from self + all parents)
    return categories.map((cat) => {
      // Get all parent category IDs (including self)
      const parentIds = this.getAllParentCategoryIdsSync(
        cat.category_id,
        categoryIdToParent,
      );

      // Collect attributes from category and all parents
      const inheritedAttributes: {
        attribute_id: string;
        attribute_name: string;
        attribute_type: string;
      }[] = [];
      const seenAttributeNames = new Set<string>();

      for (const parentId of parentIds) {
        const attrs = categoryIdToAttributes.get(parentId) || [];
        for (const attr of attrs) {
          // Avoid duplicate attributes by name (child takes precedence over parent)
          const lowerName = attr.attribute_name.toLowerCase();
          if (!seenAttributeNames.has(lowerName)) {
            seenAttributeNames.add(lowerName);
            inheritedAttributes.push(attr);
          }
        }
      }

      return {
        category_id: cat.category_id,
        category_name: cat.category_name ?? '',
        parent_id: cat.parent_id,
        parent_name: cat.parent_id
          ? categoryIdToName.get(cat.parent_id)
          : undefined,
        attributes: inheritedAttributes,
      };
    });
  }

  /**
   * Get all parent category IDs (including self) - synchronous version using pre-fetched map
   */
  private getAllParentCategoryIdsSync(
    categoryId: string,
    categoryIdToParent: Map<string, string | null>,
  ): string[] {
    const ids = [categoryId];
    let currentId: string | null = categoryId;

    while (currentId) {
      const parentId = categoryIdToParent.get(currentId);
      if (parentId) {
        ids.push(parentId);
        currentId = parentId;
      } else {
        break;
      }
    }

    return ids;
  }

  /**
   * Get all parent category IDs (including self) - async version for single category lookup
   */
  private async getAllParentCategoryIds(categoryId: string): Promise<string[]> {
    const ids = [categoryId];

    let current = await this.prisma.category.findUnique({
      where: { category_id: categoryId, is_archived: false },
      select: { parent_id: true },
    });

    while (current?.parent_id) {
      ids.push(current.parent_id);

      current = await this.prisma.category.findUnique({
        where: { category_id: current.parent_id, is_archived: false },
        select: { parent_id: true },
      });
    }

    return ids;
  }

  /**
   * Build the AI prompt with database context
   */
  private buildAIPrompt(
    userText: string,
    categories: CategoryWithAttributes[],
  ): string {
    const categoryInfo = categories.map((cat) => ({
      name: cat.category_name,
      parent: cat.parent_name || 'Root',
      attributes: cat.attributes.map((a) => a.attribute_name),
    }));

    return `You are an e-commerce product data parser. Your job is to convert plain English product descriptions into structured JSON data.

## Available Categories and Attributes in the System:
${JSON.stringify(categoryInfo, null, 2)}

## User Input:
"${userText}"

## Instructions:
1. Parse the user's natural language input to extract product information.
2. Match the product to the most appropriate existing category from the list above.
3. Extract variant attributes (like size, color) and their values.
4. If a category or attribute mentioned doesn't exist in the system, include it in the missing_categories or missing_attributes arrays.
5. For auto_generate mode: Use when user mentions combinations (e.g., "sizes M and L with colors red and blue" means all 4 combinations).
6. For manual variants: Use when user specifies specific combinations only (e.g., "size M in red, size L in blue" means only those 2 specific variants).

## Response Format (JSON only, no markdown):
{
  "product_data": {
    "category_name": "string - name of the category",
    "product_name": "string - derived product name",
    "is_new_arrival": boolean,
    "price": number or null,
    "discount": number or null,
    "discounted_price": number or null,
    "stock_quantity": number or null,
    "is_product_refundable": boolean or null,
    "description": "string or null",
    "auto_generate": boolean,
    "attributes": [
      {
        "attribute_name": "string - e.g., Size, Color",
        "values": ["string array of values - e.g., M, L"]
      }
    ],
    "product_variants": null (if auto_generate is true) OR [
      {
        "price": number,
        "discount": number or null,
        "discounted_price": number or null,
        "description": "string",
        "attributes": [
          {
            "attribute_name": "string",
            "attribute_value": "string"
          }
        ],
        "stock_quantity": number
      }
    ]
  },
  "missing_categories": [
    {
      "category_name": "string",
      "parent_category_name": "string or null"
    }
  ],
  "missing_attributes": [
    {
      "attribute_name": "string",
      "category_name": "string - which category this should belong to",
      "attribute_type": "dropdown or text"
    }
  ],
  "message": "string - helpful message about the parsed data"
}

## Important Rules:
- If a category doesn't exist, still include product_data with the category_name, and add it to missing_categories.
- If an attribute doesn't exist for the matched category, add it to missing_attributes.
- Default price to 0 if not specified.
- Default stock_quantity to 1 if not specified.
- Use auto_generate: true when user wants ALL combinations of attributes.
- Use auto_generate: false and provide product_variants when user specifies SPECIFIC combinations.
- Return ONLY valid JSON, no additional text or markdown formatting.`;
  }

  /**
   * Get API key for the specified provider
   */
  private getApiKeyForProvider(provider: AIProvider): string {
    switch (provider) {
      case AIProvider.OPENAI:
        return this.openaiApiKey;
      case AIProvider.GEMINI:
        return this.geminiApiKey;
      case AIProvider.GROQ:
        return this.groqApiKey;
      default:
        return '';
    }
  }

  /**
   * Get default model for the specified provider
   */
  private getDefaultModel(provider: AIProvider): string {
    switch (provider) {
      case AIProvider.OPENAI:
        return 'gpt-4o-mini';
      case AIProvider.GEMINI:
        return 'gemini-1.5-flash'; // Updated to use available model
      case AIProvider.GROQ:
        return 'llama-3.1-70b-versatile'; // Default Groq model
      default:
        return 'llama-3.1-70b-versatile'; // Default to Groq model
    }
  }

  /**
   * Call AI API using the helper functions
   */
  private async callAIWithProvider(
    provider: AIProvider,
    prompt: string,
    apiKey: string,
    customModel?: string,
    temperature: number = 0.3,
    maxTokens: number = 4000,
  ): Promise<AIResponse> {
    try {
      const model = customModel || this.getDefaultModel(provider);
      const result = await callAI(provider, prompt, apiKey, model, temperature, maxTokens);

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.content) {
        throw new Error('No response from AI');
      }

      // Parse the JSON response
      try {
        // Remove potential markdown code blocks
        let cleanedContent = result.content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        // Check if content is empty after cleaning
        if (!cleanedContent || cleanedContent.length === 0) {
          throw new Error(
            'AI returned empty response. The response may have been truncated. Try increasing max_tokens or using a different model.',
          );
        }

        // Try to find JSON object/array in the response if it's wrapped in text
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
          cleanedContent = jsonMatch[0];
        }

        // Validate that we have a valid JSON structure
        if (
          !cleanedContent.startsWith('{') &&
          !cleanedContent.startsWith('[')
        ) {
          throw new Error(
            `AI response does not contain valid JSON. Response preview: ${cleanedContent.substring(0, 200)}...`,
          );
        }

        const parsed = JSON.parse(cleanedContent);
        return parsed;
      } catch (parseError) {
        // Provide more detailed error information
        const errorMessage =
          parseError instanceof Error ? parseError.message : 'Unknown error';
        const contentPreview = result.content.substring(0, 500);

        throw new Error(
          `Failed to parse AI response as JSON: ${errorMessage}. Response preview: ${contentPreview}...`,
        );
      }
    } catch (error) {
      // Re-throw BadRequestException as-is, wrap others
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `AI parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Process and validate AI response against database
   */
  private async processAIResponse(
    aiResponse: AIResponse,
    categories: CategoryWithAttributes[],
  ): Promise<AIResponse> {
    if (!aiResponse.product_data) {
      return {
        ...aiResponse,
        error: 'AI could not parse product data from the input',
      };
    }

    const missingCategories: MissingCategoryDto[] = [];
    const missingAttributes: MissingAttributeDto[] = [];

    // Check if category exists
    const categoryName =
      aiResponse.product_data.category_name?.toLowerCase() || '';
    const matchedCategory = categories.find(
      (c) => c.category_name.toLowerCase() === categoryName,
    );

    if (!matchedCategory) {
      // Check AI's missing_categories list
      if (aiResponse.missing_categories?.length) {
        missingCategories.push(...aiResponse.missing_categories);
      } else {
        missingCategories.push({
          category_name: aiResponse.product_data.category_name,
          parent_category_name: undefined,
        });
      }
    }

    // Check attributes
    const attributesToCheck =
      aiResponse.product_data.attributes?.map((a) => a.attribute_name) || [];

    if (aiResponse.product_data.product_variants) {
      aiResponse.product_data.product_variants.forEach((v) => {
        v.attributes?.forEach((a) => {
          if (!attributesToCheck.includes(a.attribute_name)) {
            attributesToCheck.push(a.attribute_name);
          }
        });
      });
    }

    // Validate attributes against category
    if (matchedCategory) {
      const existingAttributeNames = matchedCategory.attributes.map((a) =>
        a.attribute_name.toLowerCase(),
      );

      for (const attrName of attributesToCheck) {
        if (!existingAttributeNames.includes(attrName.toLowerCase())) {
          // Check if AI already identified this as missing
          const alreadyInMissing = aiResponse.missing_attributes?.some(
            (ma) => ma.attribute_name.toLowerCase() === attrName.toLowerCase(),
          );

          if (!alreadyInMissing) {
            missingAttributes.push({
              attribute_name: attrName,
              category_name: matchedCategory.category_name,
              attribute_type: 'dropdown',
            });
          }
        }
      }
    }

    // Add AI-identified missing attributes
    if (aiResponse.missing_attributes?.length) {
      for (const ma of aiResponse.missing_attributes) {
        const alreadyAdded = missingAttributes.some(
          (m) => m.attribute_name.toLowerCase() === ma.attribute_name.toLowerCase(),
        );
        if (!alreadyAdded) {
          missingAttributes.push(ma);
        }
      }
    }

    return {
      ...aiResponse,
      missing_categories:
        missingCategories.length > 0 ? missingCategories : undefined,
      missing_attributes:
        missingAttributes.length > 0 ? missingAttributes : undefined,
    };
  }

  /**
   * Transform AI response to AddProductDto format
   */
  private async transformToProductDto(
    productData: AIResponse['product_data'],
    categories: CategoryWithAttributes[],
  ): Promise<any> {
    if (!productData) return undefined;

    const categoryName = productData.category_name?.toLowerCase() || '';
    const matchedCategory = categories.find(
      (c) => c.category_name.toLowerCase() === categoryName,
    );

    // Build the DTO with attribute IDs where possible
    const dto: any = {
      category_id: matchedCategory?.category_id || productData.category_name,
      product_name: productData.product_name,
      is_new_arrival: productData.is_new_arrival,
      price: productData.price,
      discount: productData.discount,
      discounted_price: productData.discounted_price,
      stock_quantity: productData.stock_quantity,
      is_product_refundable: productData.is_product_refundable,
      description: productData.description,
      auto_generate: productData.auto_generate,
    };

    // Transform attributes (for auto_generate mode)
    if (productData.attributes && matchedCategory) {
      dto.attributes = productData.attributes.map((attr) => {
        const matchedAttr = matchedCategory.attributes.find(
          (a) => a.attribute_name.toLowerCase() === attr.attribute_name.toLowerCase(),
        );
        return {
          attribute_id: matchedAttr?.attribute_id || attr.attribute_name,
          values: attr.values,
        };
      });
    } else if (productData.attributes) {
      dto.attributes = productData.attributes.map((attr) => ({
        attribute_id: attr.attribute_name,
        values: attr.values,
      }));
    }

    // Transform product_variants (for manual mode)
    if (productData.product_variants && matchedCategory) {
      dto.product_variants = productData.product_variants.map((variant) => ({
        price: variant.price,
        discount: variant.discount,
        discounted_price: variant.discounted_price,
        description: variant.description,
        sku: variant.sku,
        attributes: variant.attributes.map((attr) => {
          const matchedAttr = matchedCategory.attributes.find(
            (a) => a.attribute_name.toLowerCase() === attr.attribute_name.toLowerCase(),
          );
          return {
            attribute_id: matchedAttr?.attribute_id || attr.attribute_name,
            attribute_value: attr.attribute_value,
          };
        }),
        stock_quantity: variant.stock_quantity,
      }));
    } else if (productData.product_variants) {
      dto.product_variants = productData.product_variants.map((variant) => ({
        price: variant.price,
        discount: variant.discount,
        discounted_price: variant.discounted_price,
        description: variant.description,
        sku: variant.sku,
        attributes: variant.attributes.map((attr) => ({
          attribute_id: attr.attribute_name,
          attribute_value: attr.attribute_value,
        })),
        stock_quantity: variant.stock_quantity,
      }));
    }

    return dto;
  }

  /**
   * Transform product data with actual IDs after creating missing entities
   */
  private async transformToProductDtoWithIds(
    productData: any,
    categories: CategoryWithAttributes[],
  ): Promise<any> {
    // Find category by name if category_id is not a valid UUID
    if (productData.category_id && !this.isValidUUID(productData.category_id)) {
      const matchedCategory = categories.find(
        (c) =>
          c.category_name.toLowerCase() ===
          productData.category_id.toLowerCase(),
      );
      if (matchedCategory) {
        productData.category_id = matchedCategory.category_id;
      } else {
        throw new BadRequestException(
          `Category "${productData.category_id}" not found. Please create it first.`,
        );
      }
    }

    const matchedCategory = categories.find(
      (c) => c.category_id === productData.category_id,
    );

    // Transform attributes IDs
    if (productData.attributes && matchedCategory) {
      productData.attributes = productData.attributes.map((attr: any) => {
        if (!this.isValidUUID(attr.attribute_id)) {
          const matchedAttr = matchedCategory.attributes.find(
            (a) =>
              a.attribute_name.toLowerCase() ===
              attr.attribute_id.toLowerCase(),
          );
          if (matchedAttr) {
            return { ...attr, attribute_id: matchedAttr.attribute_id };
          }
          throw new BadRequestException(
            `Attribute "${attr.attribute_id}" not found in category. Please create it first.`,
          );
        }
        return attr;
      });
    }

    // Transform variant attributes IDs
    if (productData.product_variants && matchedCategory) {
      productData.product_variants = productData.product_variants.map(
        (variant: any) => ({
          ...variant,
          attributes: variant.attributes.map((attr: any) => {
            if (!this.isValidUUID(attr.attribute_id)) {
              const matchedAttr = matchedCategory.attributes.find(
                (a) =>
                  a.attribute_name.toLowerCase() ===
                  attr.attribute_id.toLowerCase(),
              );
              if (matchedAttr) {
                return { ...attr, attribute_id: matchedAttr.attribute_id };
              }
              throw new BadRequestException(
                `Attribute "${attr.attribute_id}" not found in category. Please create it first.`,
              );
            }
            return attr;
          }),
        }),
      );
    }

    return productData;
  }

  /**
   * Create a missing category
   */
  private async createCategory(
    missingCategory: MissingCategoryDto,
    userId: string,
  ): Promise<string> {
    let parentId: string | null = null;

    // Find parent category if specified
    if (missingCategory.parent_category_name) {
      const parentCategory = await this.prisma.category.findFirst({
        where: {
          category_name: {
            equals: missingCategory.parent_category_name,
            mode: 'insensitive',
          },
          is_archived: false,
        },
      });

      if (!parentCategory) {
        // Create parent category first
        const newParent = await this.prisma.category.create({
          data: {
            category_name: missingCategory.parent_category_name,
            created_by: userId,
          },
        });
        parentId = newParent.category_id;
      } else {
        parentId = parentCategory.category_id;
      }
    }

    // Create the category
    const newCategory = await this.prisma.category.create({
      data: {
        category_name: missingCategory.category_name,
        parent_id: parentId,
        created_by: userId,
      },
    });

    return newCategory.category_id;
  }

  /**
   * Create a missing attribute
   * Checks for duplicates in current category and parent categories
   */
  private async createAttribute(
    missingAttribute: MissingAttributeDto,
    userId: string,
  ): Promise<string> {
    // Find the category
    const category = await this.prisma.category.findFirst({
      where: {
        category_name: {
          equals: missingAttribute.category_name,
          mode: 'insensitive',
        },
        is_archived: false,
      },
    });

    if (!category) {
      throw new BadRequestException(
        `Category "${missingAttribute.category_name}" not found. Please create it first.`,
      );
    }

    // Get all parent category IDs (including self)
    const parentCategoryIds = await this.getAllParentCategoryIds(
      category.category_id,
    );

    // Check if attribute already exists in current or parent categories
    const existingAttribute = await this.prisma.categoryAttribute.findFirst({
      where: {
        attribute_name: {
          equals: missingAttribute.attribute_name,
          mode: 'insensitive',
        },
        attribute_type: {
          equals: missingAttribute.attribute_type || 'dropdown',
          mode: 'insensitive',
        },
        category_id: {
          in: parentCategoryIds,
        },
        is_archived: false,
      },
    });

    if (existingAttribute) {
      // Attribute already exists, return the existing ID
      return existingAttribute.attribute_id;
    }

    // Get the max display_sequence across current and parent categories
    const maxSequence = await this.prisma.categoryAttribute.aggregate({
      where: {
        category_id: { in: parentCategoryIds },
      },
      _max: { display_sequence: true },
    });

    const newAttribute = await this.prisma.categoryAttribute.create({
      data: {
        attribute_name: missingAttribute.attribute_name,
        attribute_type: missingAttribute.attribute_type || 'dropdown',
        category_id: category.category_id,
        display_sequence: (maxSequence._max.display_sequence ?? 0) + 1,
        created_by: userId,
      },
    });

    return newAttribute.attribute_id;
  }

  /**
   * Build human-readable message about missing entities
   */
  private buildMissingEntitiesMessage(
    missingCategories?: MissingCategoryDto[],
    missingAttributes?: MissingAttributeDto[],
  ): string {
    const parts: string[] = [];

    if (missingCategories?.length) {
      const categoryNames = missingCategories
        .map((c) => `"${c.category_name}"`)
        .join(', ');
      parts.push(`Categories not found: ${categoryNames}`);
    }

    if (missingAttributes?.length) {
      const attributeNames = missingAttributes
        .map((a) => `"${a.attribute_name}" (for ${a.category_name})`)
        .join(', ');
      parts.push(`Attributes not found: ${attributeNames}`);
    }

    if (parts.length === 0) {
      return 'Product parsed successfully';
    }

    return `${parts.join('. ')}. Do you want to create these and proceed?`;
  }

  /**
   * Check if string is a valid UUID
   */
  private isValidUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * List available models for the specified AI provider
   */
  async listAvailableModels(
    provider?: AIProvider,
  ): Promise<{
    provider: string;
    models?: Array<{
      name: string;
      displayName: string;
      supportedGenerationMethods: string[];
    }>;
    error?: string;
  }> {
    const targetProvider = provider || AIProvider.GEMINI;

    if (targetProvider === AIProvider.GEMINI) {
      const apiKey = this.getApiKeyForProvider(AIProvider.GEMINI);
      if (!apiKey) {
        return {
          provider: 'gemini',
          error: 'GEMINI_API_KEY not configured',
        };
      }

      const result = await listGeminiModels(apiKey);
      return {
        provider: 'gemini',
        ...result,
      };
    } else if (targetProvider === AIProvider.OPENAI) {
      // OpenAI models are well-documented, return common ones
      return {
        provider: 'openai',
        models: [
          {
            name: 'gpt-4o-mini',
            displayName: 'GPT-4o Mini',
            supportedGenerationMethods: ['generateContent'],
          },
          {
            name: 'gpt-4o',
            displayName: 'GPT-4o',
            supportedGenerationMethods: ['generateContent'],
          },
          {
            name: 'gpt-4-turbo',
            displayName: 'GPT-4 Turbo',
            supportedGenerationMethods: ['generateContent'],
          },
          {
            name: 'gpt-3.5-turbo',
            displayName: 'GPT-3.5 Turbo',
            supportedGenerationMethods: ['generateContent'],
          },
        ],
      };
    } else if (targetProvider === AIProvider.GROQ) {
      // Groq models - common models available
      return {
        provider: 'groq',
        models: [
          {
            name: 'llama-3.1-70b-versatile',
            displayName: 'Llama 3.1 70B Versatile',
            supportedGenerationMethods: ['generateContent'],
          },
          {
            name: 'llama-3.1-8b-instant',
            displayName: 'Llama 3.1 8B Instant',
            supportedGenerationMethods: ['generateContent'],
          },
          {
            name: 'mixtral-8x7b-32768',
            displayName: 'Mixtral 8x7B',
            supportedGenerationMethods: ['generateContent'],
          },
          {
            name: 'gemma2-9b-it',
            displayName: 'Gemma2 9B IT',
            supportedGenerationMethods: ['generateContent'],
          },
        ],
      };
    }

    return {
      provider: targetProvider,
      error: 'Unsupported provider',
    };
  }
}
