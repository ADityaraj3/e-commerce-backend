import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AiProductParserService } from './ai-product-parser.service';
import {
  ParseProductTextDto,
  ParsedProductResponseDto,
  ConfirmProductCreationDto,
  ProductCreationResponseDto,
} from './dto/ai-product-parser.dto';
import { AdminAuthGuard } from 'src/utils/guards/admin-auth.guard';
import { UserId } from 'src/utils/decorators';
import { AIProvider } from 'src/utils/helper.utils';

@ApiTags('AI Product Parser')
@Controller('admin-product/ai')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth()
export class AiProductParserController {
  constructor(private readonly aiProductParserService: AiProductParserService) {}

  /**
   * API 1: Parse plain English text to structured product JSON
   * 
   * This endpoint accepts natural language product descriptions and returns
   * a structured JSON object that can be used to create a product.
   * 
   * If any categories or attributes don't exist in the database,
   * the response will include them in missing_categories/missing_attributes
   * and ask for confirmation to create them.
   * 
   * Supports multiple AI providers: OpenAI (default) and Gemini.
   */
  @Post('parse')
  @ApiOperation({
    summary: 'Parse natural language to product JSON',
    description: `
      Takes plain English text like "Add a T-shirt of size M and L with colors red and blue" 
      and returns a structured product JSON object.
      
      The AI will:
      - Match the product to existing categories
      - Extract variant attributes and values
      - Identify any missing categories or attributes
      - Return a ready-to-use product object or ask for confirmation to create missing entities
      
      AI Provider Options:
      - groq (default): Uses Groq models (requires GROQ_API_KEY)
      - openai: Uses OpenAI GPT models (requires OPENAI_API_KEY)
      - gemini: Uses Google Gemini models (requires GEMINI_API_KEY)
      
      You can specify the AI provider via the ai_provider field in the request body.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Product parsed successfully',
    type: ParsedProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to parse product text',
  })
  async parseProductText(
    @Body() dto: ParseProductTextDto,
    @UserId() userId: string,
  ): Promise<ParsedProductResponseDto> {
    return this.aiProductParserService.parseProductText(dto, userId);
  }

  /**
   * API 2: Confirm and create product (with optional missing entity creation)
   * 
   * This endpoint takes the parsed product data (potentially modified by user)
   * and creates the product in the database.
   * 
   * If create_missing_entities is true, it will first create any missing
   * categories and attributes before creating the product.
   */
  @Post('confirm')
  @ApiOperation({
    summary: 'Confirm and create product',
    description: `
      Takes the parsed product data from the /parse endpoint and creates the product.
      
      If the user wants to create missing categories/attributes:
      - Set create_missing_entities to true
      - Include the missing_categories and missing_attributes arrays
      
      The endpoint will:
      1. Create any missing categories (in order, respecting parent relationships)
      2. Create any missing attributes
      3. Create the product and its variants
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Product created successfully',
    type: ProductCreationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to create product',
  })
  async confirmAndCreateProduct(
    @Body() dto: ConfirmProductCreationDto,
    @UserId() userId: string,
  ): Promise<ProductCreationResponseDto> {
    return this.aiProductParserService.confirmAndCreateProduct(dto, userId);
  }

  /**
   * List available AI models for a given provider
   */
  @Get('models')
  @ApiOperation({
    summary: 'List available AI models',
    description: `
      Lists all available models for the specified AI provider.
      Useful for finding which models support generateContent.
    `,
  })
  @ApiQuery({
    name: 'provider',
    enum: AIProvider,
    description: 'AI provider to list models for',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of available models',
  })
  async listModels(
    @Query('provider') provider?: AIProvider,
  ): Promise<{
    provider: string;
    models?: Array<{
      name: string;
      displayName: string;
      supportedGenerationMethods: string[];
    }>;
    error?: string;
  }> {
    return this.aiProductParserService.listAvailableModels(provider);
  }
}
