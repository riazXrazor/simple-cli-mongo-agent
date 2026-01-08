import readline from 'node:readline'
import { FunctionCallingConfigMode, GoogleGenAI } from '@google/genai'
import { MongoClient } from 'mongodb';

const mongoClient = new MongoClient(process.env.MONGO_URI!)
const db = mongoClient.db("agentic_test")
const users = db.collection("users")

const geminiModel = 'gemini-2.5-flash-lite'
const ai: GoogleGenAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});
const chatHistory: any[] = []

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const localTools = {
    async list_users(args: any){
        return await users.find({}).limit(10).toArray()
    },
    async create_user(args: {name:string; email: string; age?: number}){
        const res = await users.insertOne(args);
        return {status: "success", id: res.insertedId}
    },
    async delete_user(args: {email: string}){
        const res = await users.deleteOne(args)
        return {status: "success", data: res}
    },
    async exists_user(args: {email: string}){
        const res = await users.findOne(args)
        return res ? {status: "user exists"} : {status: "user does not exists"}
    },
    async find_user(args: {email: string}){
        const res = await users.findOne(args)
        return res
    },

}

const systemInstruction = `
You are a MongoDB Database Agent.
You have access to tools to create, delete, list, exists_user to check existence of user and find user  users.
If a user provides details like name and email, use the 'create_user' tool immediately.
if you are asked to delete user ask for confirmation before deleting also check if user exists before deleting. 
Do not just chat; use your tools.
`;
const tools: any[] = [
    {
        functionDeclarations: [
            {
                name: "list_users",
                description: "Retrieves list of users collection."
            },
            {
                name: "create_user",
                description: "Adds a new user to the users collection.",
                parameters: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        email: { type: "string" },
                        age: { type: "number" }
                    },
                    required: ["name", "email"]
                }
            },
            {
                name: "delete_user",
                description: "Delete a user from the users collection.",
                parameters: {
                    type: "object",
                    properties: {
                        email: { type: "string" }
                    },
                    required: ["email"]
                }
            },
            {
                name: "find_user",
                description: "Find a user and return its details from the users collection.",
                parameters: {
                    type: "object",
                    properties: {
                        email: { type: "string" }
                    },
                    required: ["email"]
                }
            },
            {
                name: "exists_user",
                description: "check existence of a user from the users collection.",
                parameters: {
                    type: "object",
                    properties: {
                        email: { type: "string" }
                    },
                    required: ["email"]
                }
            }
        ]
    }
];

async function sendToLLM(message: string, role: string) {
    chatHistory.push({
        role,
        parts: [{text:message}]
    })
    try{
            const chat = await ai.models.generateContent({
                model: geminiModel,
                contents: chatHistory,
                config:{
                    tools,
                    systemInstruction,
                    toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } }
                }
            })

        let chatResMsg = chat.candidates?.[0]?.content
        if (!chatResMsg) return "No response from model.";

        const toolCalls = chatResMsg?.parts?.filter(p=>p.functionCall)
        
        if(toolCalls && toolCalls?.length > 0){
            chatHistory.push(chatResMsg)

            const toolResponsesParts = await Promise.all(toolCalls.map(async (call) => {
                const { name, args } = call.functionCall!;
                console.log(`\x1b[33m[Agent] Executing: ${name}\x1b[0m`);
                
                const data = await (localTools as any)[name!](args);
                
                return {
                    functionResponse: {
                        name,
                        response: { result: data }
                    }
                };
            }));

                const finalResponse = await ai.models.generateContent({
                    model: geminiModel,
                    contents:[...chatHistory, {role: "model", parts: toolResponsesParts }],
                    config: {tools, systemInstruction}
                })

                const finalContent = finalResponse.candidates?.[0]?.content
                chatHistory.push(finalContent)
                return finalResponse.text
        }


        chatHistory.push(chatResMsg)

        return chat.text
    }catch(e:any){
        if(e.status === 429){
            console.log(`\x1b[31m You have hit the rate limit for the model ${geminiModel} \x1b[0m`);
        }

        return ''
    }

}

async function main(){
    await mongoClient.connect()
    console.log("MongoDB Database Agent Online. Type 'exit' to quit.");
    const ask = () => {
        rl.question("\x1b[36mYou: \x1b[0m", async (q) => {
            if (q.toLowerCase() === "exit") process.exit();
            const res = await sendToLLM(q, 'user');
            console.log(`\x1b[32mAI: \x1b[0m${res}\n`);
            ask();
        });
    };
    ask();
}

main()