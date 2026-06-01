import { NextResponse } from "next/server";

export async function POST(req: Request) {

const body = await req.json();

return NextResponse.json({
success:true,

seoScore:87,

advantages:[
"Faster Website",
"Better Content",
"More Backlinks"
],

weakness:[
"Poor Technical SEO",
"Low Authority"
]
});

}
