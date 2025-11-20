import {
  Controller,
  Post,
  UseInterceptors,
  Response,
  Request,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MediaService } from './media.service';

@ApiTags('Media upload')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // Upload in server
  @Post('upload/media')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          const baseDir = path.join(
            process.env.UPLOADS_BASE_DIR || 'uploads',
            'media',
          );

          const ext = path.extname(file.originalname).toLowerCase();

          if (ext === '.pdf') {
            const pdfDir = path.join(baseDir, 'pdf');
            fs.mkdirSync(pdfDir, { recursive: true });
            cb(null, pdfDir);
          } else {
            fs.mkdirSync(baseDir, { recursive: true });
            cb(null, baseDir);
          }
        },
        filename: (req, file, cb) => {
          cb(null, uuidv4() + path.extname(file.originalname));
        },
      }),
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB
      },
    }),
  )
  async uploadFilesBuilder(@Response() res, @Request() req) {
    return await this.mediaService.uploadLogic(res, req);
  }

  //upload on cloudinary [send box]
  @Post('cloudinary/upload/media')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Files uploaded successfully' })
  @ApiResponse({ status: 500, description: 'Error while uploading files' })
  @UseInterceptors(
    AnyFilesInterceptor({
      limits: {
        fileSize: 500 * 1024 * 1024,
      },
    }),
  )
  async uploadOnCloud(@Response() res, @Request() req) {
    return await this.mediaService.uploadCloudinary(res, req);
  }
}
