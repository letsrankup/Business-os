type ResultProps = {
  result: {
    seoScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
};

export default function CompetitorResult({
  result,
}: ResultProps) {
  return (
    <div className="mt-6 rounded-xl border border-gray-700 p-5">

      <h2 className="text-xl font-bold mb-4">
        Analysis Result
      </h2>

      <div className="mb-4">
        <strong>SEO Score:</strong> {result.seoScore}/100
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">
          Strengths
        </h3>

        <ul className="space-y-1">
          {result.strengths.map((item, index) => (
            <li key={index}>✅ {item}</li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">
          Weaknesses
        </h3>

        <ul className="space-y-1">
          {result.weaknesses.map((item, index) => (
            <li key={index}>❌ {item}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold mb-2">
          Recommendations
        </h3>

        <ul className="space-y-1">
          {result.recommendations.map((item, index) => (
            <li key={index}>🚀 {item}</li>
          ))}
        </ul>
      </div>

    </div>
  );
}
