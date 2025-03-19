import { Hono } from "hono";
import OpenAI from "openai";

interface Env {
  OPENAI_API_KEY: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const app = new Hono<{ Bindings: Env }>();

    const client: OpenAI = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    app.get("/", (c) => {
      return c.text("Hello Hono!");
    });

    app.get("/test", async (c) => {
      const completion = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: "Write a one-sentence bedtime story about a unicorn.",
          },
        ],
      });

      return c.body(completion.choices[0].message.content ?? "");
    });

    return app.fetch(request, env, ctx);
  },
};
