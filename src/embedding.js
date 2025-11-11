import "./config/environment.js";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
const OPENAI_OBJECT = new OpenAI({ apiKey: process.env.CHATGPT_API_KEY });

export const cosineSimilarity = (a, b) => {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};

export function embeddingToBuffer(embedding) {
  const buffer = Buffer.allocUnsafe(embedding.length * 4); // 4 bytes per float32
  embedding.forEach((val, i) => buffer.writeFloatLE(val, i * 4));
  return buffer;
}

// Convert buffer back to embedding
export function bufferToEmbedding(buffer) {
  const embedding = [];
  for (let i = 0; i < buffer.length; i += 4) {
    embedding.push(buffer.readFloatLE(i));
  }
  return embedding;
}


export async function getEmbedding(text, model = "text-embedding-3-small") {
  const cleanText = text.replace(/\n/g, " ");
  const response = await OPENAI_OBJECT.embeddings.create({
    input: [cleanText],
    model: model,
  });
  return response.data[0].embedding;
}

export async function searchInEmbedding(query, topK = 5, threshold = 0.3) {
  const queryEmbedding = await getEmbedding(query);
  fs.writeFileSync(path.join(process.cwd(), "queryEmbedding.txt"), JSON.stringify(queryEmbedding));
  //  console.log('Query Embedding:', queryEmbedding);
  try {
    const filePath = path.join(process.cwd(), "embeedingResult.txt");
    const fileContent = fs.readFileSync(filePath, "utf8");
    const contentEmbedding = JSON.parse(fileContent);
    
    const contentFromFile = fs.readFileSync(path.join(process.cwd(), "content.txt"), "utf8");
     
    const similarities = [];


    const similarity = cosineSimilarity(queryEmbedding, contentEmbedding);
    console.log('Similarity:', similarity);

    if (similarity >= threshold) {
       
      similarities.push({
        id: 1,
        content: contentFromFile,
        score: similarity,
        metadata: {},
      });
    }
    // Sort by similarity and return top K
    similarities.sort((a, b) => b.score - a.score);
    return similarities.slice(0, topK);
  } catch (error) {
    console.error("Error reading file:", error.message);
  }
}
// const rootContent = fs.readFileSync(path.join(process.cwd(), "content.txt"), "utf8");
// console.log("Root content:", rootContent);
//  const gE =  await getEmbedding(rootContent);

// fs.writeFileSync(path.join(process.cwd(), "embeedingResult.txt"), JSON.stringify(gE));
// process.exit(0);
// const query ="How does Sir Rowan defeat Varkon?";
// const similarContents = await searchInEmbedding(
//   query,
// );

// if (similarContents.length === 0) {
//   console.log("No similar content found.");
//   process.exit(0);
// }
//  const context = similarContents
//       .map((item, idx) => `[${idx + 1}] ${item.content}`)
//       .join('\n\n');

//     // Step 3: Create prompt for OpenAI
//     const systemPrompt = `You are a helpful assistant that answers questions based on the provided context. 
// Use only the information from the context to answer. If the context doesn't contain enough information, say so.
// Always cite which source number [1], [2], etc. you used for each piece of information.`;

//     const userPrompt = `Context:
// ${context}

// Question: ${query}

// Please provide a clear, accurate answer based on the context above. Cite your sources using [1], [2], etc.`;

//     // Step 4: Get answer from OpenAI Chat API
//     const response = await OPENAI_OBJECT.chat.completions.create({
//       model: 'gpt-4o-mini', // Fast and cost-effective, use 'gpt-4o' for better quality
//       messages: [
//         { role: 'system', content: systemPrompt },
//         { role: 'user', content: userPrompt }
//       ],
//       temperature: 0.3, // Lower temperature for more focused answers
//       max_tokens: 500
//     });

//     const answer = response.choices[0].message.content;

//     // Step 5: Return structured response
//     console.log('Answer:', answer);
    
    // {
    //   answer: answer,
    //   sources: similarContents.map(item => ({
    //     id: item.id,
    //     content: item.content,
    //     score: item.score,
    //     metadata: item.metadata
    //   })),
    //   confidence: similarContents[0]?.score || 0,
    //   model: 'gpt-4o-mini'
    // };

