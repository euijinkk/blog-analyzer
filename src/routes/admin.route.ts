import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { setBlogVisibility } from '../db/blog-analysis';
import type { Env } from '../index';

const adminRoute = new Hono<{ Bindings: Env }>();

adminRoute.patch(
  '/blog-visibility',
  zValidator(
    'json',
    z.object({
      blogUrl: z.string().url(),
      hidden: z.boolean(),
    })
  ),
  async (c) => {
    const { blogUrl, hidden } = c.req.valid('json');
    const updated = await setBlogVisibility(c.env.DB, blogUrl, hidden);

    if (!updated) {
      return c.json({ error: '대상 블로그를 찾을 수 없습니다.' }, 404);
    }

    return c.json({
      blogUrl: updated.blog_url,
      hidden: updated.is_hidden === 1,
    });
  }
);

export default adminRoute;
