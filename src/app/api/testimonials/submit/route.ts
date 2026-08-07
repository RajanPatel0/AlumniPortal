import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const testimonialSubmitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  batch: z.union([z.string(), z.number()]).optional(),
  quote: z.string().min(3, 'Testimonial text must be at least 3 characters'),
  rating: z.coerce.number().optional().default(5),
  company: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  linkedIn: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = testimonialSubmitSchema.safeParse(body);

    if (!validation.success) {
      console.warn('[TESTIMONIAL_VALIDATION_FAILED]', validation.error.issues);
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, batch, quote, company, designation, linkedIn } = validation.data;

    let parsedBatch: number | null = null;
    if (batch) {
      const num = typeof batch === 'number' ? batch : parseInt(String(batch).trim(), 10);
      if (!isNaN(num)) parsedBatch = num;
    }

    // Store testimonial in Database as pending (isActive: false)
    const testimonial = await prisma.landingTestimonial.create({
      data: {
        name: name.trim(),
        photo: null,
        batchYear: parsedBatch,
        quote: quote.trim(),
        company: company?.trim() || null,
        designation: designation?.trim() || null,
        linkedIn: linkedIn?.trim() || null,
        isSpotlight: false,
        isActive: false, // Pending admin approval
      },
    });

    return NextResponse.json({
      success: true,
      id: testimonial.id,
      message: 'Your testimonial has been submitted successfully and is pending administrative approval.',
    });
  } catch (error: any) {
    console.error('[TESTIMONIAL_SUBMIT_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to submit testimonial. Please try again later.' },
      { status: 500 }
    );
  }
}
