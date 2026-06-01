import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const website = body.website || "";
    const competitor = body.competitor || "";

    if (!website || !competitor) {
      return NextResponse.json(
        {
          success: false,
          message: "Website and competitor are required",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      seoScore: 86,
      website,
      competitor,
      strengths: [
        "Good page speed",
        "Strong content quality",
        "Mobile friendly",
      ],
      weaknesses: [
        "Weak backlink profile",
        "Limited internal linking",
        "Low domain authority",
      ],
      recommendations: [
        "Improve backlinks",
        "Add more content clusters",
        "Optimize technical SEO",
      ],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
