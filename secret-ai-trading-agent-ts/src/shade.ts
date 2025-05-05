import { MsgExecuteContract } from "secretjs";


interface Snip20SendMsg {
    send: {
        recipient: string;
        amount: string;
        msg: string;
        padding?: string;
    };
}

export function msgBuyScrt(senderAddress: string, amountUsdc: string): MsgExecuteContract<Snip20SendMsg> {
    const sUsdcAddress = "secret1vkq022x4q8t8kx9de3r84u669l65xnwf2lg3e6";
    const shadeRouterAddress = "secret1pjhdug87nxzv0esxasmeyfsucaj98pw4334wyc";

    const swapMsgBase64 = "eyJzd2FwX3Rva2Vuc19mb3JfZXhhY3QiOnsiZXhwZWN0ZWRfcmV0dXJuIjoiMSIsInBhdGgiOlt7ImFkZHIiOiJzZWNyZXQxcXo1N3BlYTRrM25kbWpweTZ0ZGpjdXE0dHpydmpuMGFwaGNhMGsiLCJjb2RlX2hhc2giOiJlODgxNjUzNTNkNWQ3ZTc4NDdmMmM4NDEzNGMzZjc4NzFiMmVlZTY4NGZmYWM5ZmNmOGQ5OWE0ZGEzOWRjMmYyIn0seyJhZGRyIjoic2VjcmV0MWE2ZWZuejl5NzAycGN0bW56ZWp6a2pkeXEwbTYyanlwd3NmazkyIiwiY29kZV9oYXNoIjoiZTg4MTY1MzUzZDVkN2U3ODQ3ZjJjODQxMzRjM2Y3ODcxYjJlZWU2ODRmZmFjOWZjZjhkOTlhNGRhMzlkYzJmMiJ9LHsiYWRkciI6InNlY3JldDF5Nnc0NWZ3ZzlsbjlweGQ2cXlzOGx0amxudHU5eGE0ZjJkZTdzcCIsImNvZGVfaGFzaCI6ImU4ODE2NTM1M2Q1ZDdlNzg0N2YyYzg0MTM0YzNmNzg3MWIyZWVlNjg0ZmZhYzlmY2Y4ZDk5YTRkYTM5ZGMyZjIifV19fQ==";
    const sUsdcCodeHash = "638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e"; // From python code

    return new MsgExecuteContract<Snip20SendMsg>({
        sender: senderAddress,
        contract_address: sUsdcAddress,
        code_hash: sUsdcCodeHash, 
        msg: {
            send: {
                recipient: shadeRouterAddress,
                amount: amountUsdc,
                msg: swapMsgBase64,
                padding: "Iq7w0EzEpkt",
            }
        },
        sent_funds: [],
    });
}

export function msgSellScrt(senderAddress: string, amountScrt: string): MsgExecuteContract<Snip20SendMsg> {
    const sScrtAddress = "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek";
    const shadeRouterAddress = "secret1pjhdug87nxzv0esxasmeyfsucaj98pw4334wyc";
    const swapMsgBase64 = "eyJzd2FwX3Rva2Vuc19mb3JfZXhhY3QiOnsiZXhwZWN0ZWRfcmV0dXJuIjoiMSIsInBhdGgiOlt7ImFkZHIiOiJzZWNyZXQxeTZ3NDVmd2c5bG45cHhkNnF5czhsdGpsbnR1OXhhNGYyZGU3c3AiLCJjb2RlX2hhc2giOiJlODgxNjUzNTNkNWQ3ZTc4NDdmMmM4NDEzNGMzZjc4NzFiMmVlZTY4NGZmYWM5ZmNmOGQ5OWE0ZGEzOWRjMmYyIn0seyJhZGRyIjoic2VjcmV0MWE2ZWZuejl5NzAycGN0bW56ZWp6a2pkeXEwbTYyanlwd3NmazkyIiwiY29kZV9oYXNoIjoiZTg4MTY1MzUzZDVkN2U3ODQ3ZjJjODQxMzRjM2Y3ODcxYjJlZWU2ODRmZmFjOWZjZjhkOTlhNGRhMzlkYzJmMiJ9LHsiYWRkciI6InNlY3JldDFxejU3cGVhNGszbmRtanB5NnRkamN1cTR0enJ2am4wYXBoY2EwayIsImNvZGVfaGFzaCI6ImU4ODE2NTM1M2Q1ZDdlNzg0N2YyYzg0MTM0YzNmNzg3MWIyZWVlNjg0ZmZhYzlmY2Y4ZDk5YTRkYTM5ZGMyZjIifV19fQ==";
    const sScrtCodeHash = "af74387e276be8874f07bec3a87023ee49b0e7ebe08178c49d0a49c3c98ed60e"; // From python code

     return new MsgExecuteContract<Snip20SendMsg>({
        sender: senderAddress,
        contract_address: sScrtAddress,
        code_hash: sScrtCodeHash,
        msg: {
            send: {
                recipient: shadeRouterAddress,
                amount: amountScrt,
                msg: swapMsgBase64,
                padding: "Wur83ulCyYEvQ",
            }
        },
        sent_funds: [],
    });
} 