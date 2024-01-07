import { boot } from 'quasar/wrappers';
import OpenAI from 'openai';
import { is } from 'quasar';

const openai = new OpenAI({
  apiKey: process.env.GPT_KEY,
  dangerouslyAllowBrowser: true,
});

console.log('we in the right place');

// Define your custom method
async function gptFromText(input: string): Promise<string> {
  // Your method logic here, you can use the 'openai' instance

  try {
    const message = input;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: message },
        { role: 'assistant', content: '' },
      ],
      temperature: 0,
      max_tokens: 1000,
    });
    console.log('Response from OpenAI: ', JSON.stringify(response));

    // const response_json = JSON.parse(
    //   '{"id":"chatcmpl-8F6G3D6HAlsenRxCJ5M88hPMqkKZO","object":"chat.completion","created":1698609667,"model":"gpt-3.5-turbo-0613","choices":[{"index":0,"message":{"role":"assistant","content":"The capital of Georgia is Tbilisi."},"finish_reason":"stop"}],"usage":{"prompt_tokens":18,"completion_tokens":9,"total_tokens":27}}'
    // );

    console.log('Response from OpenAI: ', response);
    console.log('Response from OpenAI: ', response.choices[0].message.content);
    if (response.choices[0].message.content) {
      return response.choices[0].message.content;
    } else {
      return 'Error: ' + response;
    }
  } catch (err) {
    console.log('Error: ', err);
    return 'Error: ' + err;
  }
}

export default boot(({ app }) => {
  app.config.globalProperties.$openai = openai;
  app.config.globalProperties.$gptFromText = gptFromText;
});

export { openai, gptFromText };
