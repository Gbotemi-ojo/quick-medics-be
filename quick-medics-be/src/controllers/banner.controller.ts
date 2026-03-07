import { Request, Response } from 'express';
import { db } from '../config/database';
import { banners } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import cloudinary from '../config/cloudinary';
import fs from 'fs';
import sharp from 'sharp'; // Import sharp

export const getBanners = async (req: Request, res: Response) => {
  try {
    const allBanners = await db.select()
        .from(banners)
        .orderBy(desc(banners.createdAt));
    res.status(200).json({ success: true, data: allBanners });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch banners' });
  }
};

export const createBanner = async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    
    // Check if file exists (via Multer)
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file is required' });
    }

    // --- AUTO COMPRESSION LOGIC START ---
    const compressedPath = `${req.file.path}-opt.jpg`;

    // Resize to max 1920px width and compress to 80% quality
    await sharp(req.file.path)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true }) 
        .jpeg({ quality: 80, mozjpeg: true }) 
        .toFile(compressedPath);
    // --- AUTO COMPRESSION LOGIC END ---

    // Upload the COMPRESSED file to Cloudinary
    const result = await cloudinary.uploader.upload(compressedPath, {
      folder: 'quick_medics_banners',
    });

    // Clean up BOTH temp files (original heavy one + compressed one)
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    if (fs.existsSync(compressedPath)) fs.unlinkSync(compressedPath);

    // Save to DB
    await db.insert(banners).values({
        title,
        description,
        imageUrl: result.secure_url,
        publicId: result.public_id,
        isActive: true
    });

    res.status(201).json({ success: true, message: 'Banner uploaded successfully' });
  } catch (error: any) {
    console.error('Banner upload error:', error);
    
    // Attempt cleanup if error occurs
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    
    res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to upload banner' 
    });
  }
};

export const deleteBanner = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    
    // Get banner to find publicId
    const banner = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
    
    if (banner.length > 0) {
        // Delete from Cloudinary
        if (banner[0].publicId) {
            await cloudinary.uploader.destroy(banner[0].publicId);
        }
        // Delete from DB
        await db.delete(banners).where(eq(banners.id, id));
    }

    res.status(200).json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting banner' });
  }
};

export const toggleBannerStatus = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const { isActive } = req.body;
        await db.update(banners).set({ isActive }).where(eq(banners.id, id));
        res.status(200).json({ success: true, message: 'Banner status updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating status' });
    }
};
