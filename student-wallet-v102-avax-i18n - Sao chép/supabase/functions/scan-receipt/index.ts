import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-3-flash-preview",
  "gemini-2.0-flash",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY")?.trim();
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageBase64, mimeType, categories = ["Khác"], today = "", temperature = 0 } = await req.json();

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "Invalid imageBase64" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Bạn là trợ lý trích xuất hóa đơn mua hàng đa quốc gia (Việt Nam, Mỹ, Nga, Thụy Sĩ, Châu Âu, Nhật, Hàn, Singapore, Úc, Thái Lan...) cho ứng dụng quản lý chi tiêu sinh viên.
Hãy đọc ảnh hóa đơn đính kèm (có thể viết bằng tiếng Việt, Anh, Nga, Đức, Pháp, Nhật, Hàn...) và trả về DUY NHẤT một đối tượng JSON hợp lệ (không bọc trong markdown \`\`\`json) theo cấu trúc sau:
{
  "shop": "Tên cửa hàng hoặc quán (giữ nguyên ngôn ngữ gốc trên hóa đơn, ngắn gọn)",
  "date": "YYYY-MM-DD (đọc thật kỹ ngày tháng in trên hóa đơn theo mọi định dạng kể cả khi dính liền giờ như 30.07.2007/13:29:17, DD/MM/YYYY, MM/DD/YYYY, DD.MM.YYYY, YYYY-MM-DD, DD.MM.YY, tên tháng tiếng Anh/Nga/Đức...; nếu hóa đơn thực sự không ghi ngày thì để chuỗi rỗng \"\")",
  "currency": "Mã tiền tệ 3 ký tự ISO 4217 chính của hóa đơn: VND, USD, RUB, EUR, CHF (Fr., CHF), GBP, JPY, KRW, CNY, SGD, AUD, CAD, THB... Lấy đúng mã tiền tệ chính ghi ở dòng Total (ví dụ Total: CHF 54.50 -> \"CHF\"). Mặc định VND chỉ khi hóa đơn không ghi bất kỳ ngoại tệ nào.",
  "total": 0,
  "confidence": "high | medium | low",
  "uncertainFields": ["fields or lines that are unreadable or ambiguous"],
  "cat": "Chọn 1 danh mục phù hợp nhất trong danh sách: ${JSON.stringify(categories)}",
  "items": [
    { "n": "Tên món/sản phẩm (giữ nguyên ngôn ngữ gốc trên hóa đơn)", "a": 0, "c": "Chọn 1 danh mục phù hợp nhất từ danh sách trên" }
  ]
}
Quy tắc QUAN TRỌNG:
- Giữ nguyên SỐ TIỀN GỐC theo đúng đơn vị tiền tệ trên hóa đơn ("currency"):
  + Nếu là VND: trả số nguyên (ví dụ: 55000).
  + Nếu là ngoại tệ như CHF (54.50 -> 54.5), USD ($12.50 -> 12.5), RUB (450,50 ₽ -> 450.5), EUR (€19.99 -> 19.99): trả số thập phân chuẩn dùng dấu chấm (.) làm dấu thập phân, KHÔNG tự nhân tỷ giá và KHÔNG bỏ phần lẻ thập phân.
- Chỉ chép đúng tên và giá nhìn thấy được trên từng dòng hàng. Không điều chỉnh, phân bổ, chia tỷ lệ hoặc suy đoán giá của món để khớp tổng.
- Thuế, giảm giá, phí ship, tip chỉ được ghi thành dòng riêng nếu dòng đó thực sự được in và đọc được trên ảnh. Không tạo dòng phụ để bù phần chênh lệch.
- Nếu không đọc được giá, không tự điền giá ước lượng; đánh dấu confidence medium/low và ghi dòng đó vào uncertainFields. Nếu không đọc được món hàng, để items rỗng; tuyệt đối không biến tổng hóa đơn thành một món giả.
- Chỉ đánh dấu confidence high khi các trường quan trọng đọc rõ. Nếu tổng dòng hàng lệch tổng hóa đơn, giữ nguyên tất cả giá dòng và ghi rõ trong uncertainFields.
- Đọc thật kỹ ngày in trên hóa đơn (bất kể năm 2000-2099, kể cả khi dính liền dấu gạch chéo với giờ như 30.07.2007/13:29:17 -> 2007-07-30) và chuẩn hóa sang YYYY-MM-DD.
- Nếu không đọc được hóa đơn, trả về {"shop":"","date":"","currency":"VND","total":0,"cat":"Khác","items":[]}.`;

    let lastError = "";
    for (const model of MODELS) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inlineData: { mimeType: mimeType || "image/jpeg", data: imageBase64 } },
                ],
              },
            ],
            generationConfig: {
              temperature: Number(temperature) || 0,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const cleanedText = rawText.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleanedText);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("AI response is not a JSON object");
        if (!Array.isArray(parsed.items)) parsed.items = [];
        if (!Array.isArray(parsed.uncertainFields)) parsed.uncertainFields = [];
        if (!["high", "medium", "low"].includes(String(parsed.confidence || "").toLowerCase())) parsed.confidence = "low";
        if (!parsed.total || !parsed.items.length || String(parsed.confidence).toLowerCase() !== "high") {
          if (!parsed.uncertainFields.includes("manual_review_required")) parsed.uncertainFields.push("manual_review_required");
        }

        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const errText = await res.text();
      console.error(`Model ${model} failed (${res.status}):`, errText);
      lastError = `${model}: ${res.status} - ${errText.slice(0, 200)}`;
      if (res.status !== 404) break;
    }

    return new Response(
      JSON.stringify({ error: `Gemini API Error: ${lastError}` }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Edge Function Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
