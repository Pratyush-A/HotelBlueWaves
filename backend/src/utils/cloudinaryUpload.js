import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dedshewoz',
  api_key: process.env.CLOUDINARY_API_KEY || '961582857746382',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'TItkkW4XNNsJb1vg546dq_FA624',
});

export default cloudinary;
