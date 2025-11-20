import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import cloudinary from 'src/utils/cloudinary.config';
import { Readable } from 'stream';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async uploadLogic(res, req) {
    try {
      const inputFiles = req.files as Express.Multer.File[];

      if (!inputFiles || inputFiles.length === 0) {
        throw new HttpException('No files uploaded', HttpStatus.BAD_REQUEST);
      }

      const uploadedFiles = [];

      for (const file of inputFiles) {
        const fullPath = path.join(file.destination, file.filename);
        let relativePath = path.relative(process.cwd(), fullPath);

        relativePath = relativePath.replace(/\\/g, '/');

        const media = await this.prisma.media.create({
          data: {
            original_file_name: file.originalname,
            mimetype: file.mimetype,
            file_name: file.filename,
            file_path: relativePath,
            size: file.size,
          },
        });

        uploadedFiles.push({
          media_id: media.media_id,
          original_file_name: media.original_file_name,
          mimetype: media.mimetype,
          size: media.size,
          file_path: media.file_path,
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Files uploaded successfully',
        data: uploadedFiles,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Upload failed',
        error: error.message,
      });
    }
  }

  async uploadCloudinary(res, req) {
    try {
      const inputFiles = req.files as Express.Multer.File[];

      if (!inputFiles || inputFiles.length === 0) {
        throw new HttpException('No files uploaded', HttpStatus.BAD_REQUEST);
      }

      const uploadedFiles = [];

      for (const file of inputFiles) {
        const cloudinaryResult = await this.uploadToCloudinary(file);

        console.log(JSON.stringify(cloudinary, null, 2));
        console.log('cloudinaryResult.public_id', cloudinaryResult.public_id);

        const media = await this.prisma.media.create({
          data: {
            original_file_name: cloudinaryResult.public_id, // Store public_id for delete later
            mimetype: file.mimetype,
            file_name: cloudinaryResult.public_id,
            file_path: cloudinaryResult.secure_url,
            size: file.size,
          },
        });

        uploadedFiles.push({
          media_id: media.media_id,
          original_file_name: media.original_file_name,
          mimetype: media.mimetype,
          size: media.size,
          file_path: media.file_path,
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Files uploaded to Cloudinary successfully',
        data: uploadedFiles,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Cloudinary upload failed',
        error: error.message,
      });
    }
  }

  private uploadToCloudinary(file: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto', // Automatically detect file type
          folder: 'uploads', // Optional: organize in folders
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      // Convert buffer to stream and pipe to Cloudinary
      const bufferStream = Readable.from(file.buffer);
      bufferStream.pipe(uploadStream);
    });
  }
}
