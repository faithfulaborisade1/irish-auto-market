// src/app/api/admin/notification-sound/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/database';

export const dynamic = 'force-dynamic';

// Verify admin authentication
async function verifyAdminAuth(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value || 
                  request.cookies.get('auth-token')?.value;
    
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      include: { adminProfile: true }
    });

    if (!user?.adminProfile) return null;

    return {
      userId: decoded.userId,
      adminId: user.adminProfile.id,
      role: user.adminProfile.adminRole
    };
  } catch (error) {
    return null;
  }
}

// GET - Return current sound info
export async function GET(request: NextRequest) {
  const adminAuth = await verifyAdminAuth(request);
  if (!adminAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const soundPath = path.join(process.cwd(), 'public', 'admin', 'notification-sounds', 'custom.mp3');
    const soundExists = existsSync(soundPath);

    return NextResponse.json({
      success: true,
      soundExists,
      soundUrl: soundExists ? '/admin/notification-sounds/custom.mp3' : null,
      defaultUrl: '/admin/notification-sounds/default-beep.mp3'
    });
  } catch (error) {
    console.error('Error checking sound file:', error);
    return NextResponse.json(
      { error: 'Failed to check sound file' },
      { status: 500 }
    );
  }
}

// POST - Upload new notification sound
export async function POST(request: NextRequest) {
  const adminAuth = await verifyAdminAuth(request);
  if (!adminAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('soundFile') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No sound file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'File must be an audio file' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File must be smaller than 5MB' },
        { status: 400 }
      );
    }

    // Validate duration (max 10 seconds for notification sounds)
    // Note: We can't easily validate duration server-side without additional libraries
    // This could be done client-side before upload

    // Create directory if it doesn't exist
    const soundDir = path.join(process.cwd(), 'public', 'admin', 'notification-sounds');
    if (!existsSync(soundDir)) {
      await mkdir(soundDir, { recursive: true });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file as custom.mp3 (overwrite existing)
    const soundPath = path.join(soundDir, 'custom.mp3');
    await writeFile(soundPath, buffer);

    // Log the admin action
    console.log(`🔊 Notification sound updated by admin: ${adminAuth.adminId}`);

    // Optional: Log to database
    try {
      // You could add this to your admin audit log
      // await logAdminAction(adminAuth.adminId, 'NOTIFICATION_SOUND_UPDATED', { fileName: file.name, fileSize: file.size });
    } catch (logError) {
      console.error('Failed to log admin action:', logError);
      // Don't fail the upload for logging errors
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sound updated successfully',
      soundUrl: '/admin/notification-sounds/custom.mp3',
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        uploadedBy: adminAuth.adminId
      }
    });

  } catch (error) {
    console.error('Error uploading notification sound:', error);
    return NextResponse.json(
      { error: 'Failed to upload sound file' },
      { status: 500 }
    );
  }
}

// DELETE - Remove custom sound (revert to default)
export async function DELETE(request: NextRequest) {
  const adminAuth = await verifyAdminAuth(request);
  if (!adminAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const soundPath = path.join(process.cwd(), 'public', 'admin', 'notification-sounds', 'custom.mp3');
    
    if (existsSync(soundPath)) {
      const fs = await import('fs/promises');
      await fs.unlink(soundPath);
      console.log(`🗑️ Custom notification sound deleted by admin: ${adminAuth.adminId}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Custom notification sound removed',
      soundUrl: null
    });

  } catch (error) {
    console.error('Error deleting notification sound:', error);
    return NextResponse.json(
      { error: 'Failed to delete sound file' },
      { status: 500 }
    );
  }
}