import { ChatOpenAI } from "langchain/chat_models/openai";
import { HttpResponseOutputParser } from "langchain/output_parsers";

const handler = async () => {
  const parser = new HttpResponseOutputParser({
    contentType: "text/event-stream",
  });

  const model = new ChatOpenAI({ temperature: 0 });

  const stream = await model.pipe(parser).stream("Hello there!");

  const httpResponse = new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
    },
  });

  return httpResponse;
};

await handler();
