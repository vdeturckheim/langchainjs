import { BaseMessage } from "../schema/index.js";
import {
  BaseTransformOutputParser,
  StringOutputParser,
} from "../schema/output_parser.js";

export type HttpResponseOutputParserInput = {
  outputParser?: BaseTransformOutputParser;
  contentType?: "text/plain" | "text/event-stream";
};

/**
 * OutputParser that formats chunks emitted from an LLM for different HTTP content types.
 */
export class HttpResponseOutputParser extends BaseTransformOutputParser<Uint8Array> {
  static lc_name() {
    return "HttpResponseOutputParser";
  }

  lc_namespace = ["langchain", "output_parser"];

  lc_serializable = true;

  outputParser: BaseTransformOutputParser = new StringOutputParser();

  contentType: "text/plain" | "text/event-stream" = "text/plain";

  constructor(fields?: HttpResponseOutputParserInput) {
    super(fields);
    this.outputParser = fields?.outputParser ?? this.outputParser;
    this.contentType = fields?.contentType ?? this.contentType;
  }

  async *_transform(
    inputGenerator: AsyncGenerator<string | BaseMessage>
  ): AsyncGenerator<Uint8Array> {
    for await (const chunk of this.outputParser._transform(inputGenerator)) {
      if (typeof chunk === "string") {
        yield this.parse(chunk);
      } else {
        yield this.parse(JSON.stringify(chunk));
      }
    }
    if (this.contentType === "text/event-stream") {
      const encoder = new TextEncoder();
      yield encoder.encode(`event: end\n\n`);
    }
  }

  /**
   * Parses a string output from an LLM call. This method is meant to be
   * implemented by subclasses to define how a string output from an LLM
   * should be parsed.
   * @param text The string output from an LLM call.
   * @param callbacks Optional callbacks.
   * @returns A promise of the parsed output.
   */
  async parse(text: string): Promise<Uint8Array> {
    const chunk = await this.outputParser.parse(text);
    let parsedChunk;
    if (typeof chunk === "string") {
      parsedChunk = chunk;
    } else {
      parsedChunk = JSON.stringify(chunk);
    }
    const encoder = new TextEncoder();
    if (this.contentType === "text/event-stream") {
      return encoder.encode(`event: data\ndata: ${parsedChunk}\n\n`);
    }
    return encoder.encode(parsedChunk);
  }

  getFormatInstructions(): string {
    return "";
  }
}
