import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PendingCounselorDetail({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  // TODO: fetch counselor submission
  const documents = [
    { name: "License.pdf", url: "#" },
    { name: "ID Verification.jpg", url: "#" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submission: {id}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-zinc-500">Username</div>
              <div className="font-medium">CounselorGuide451</div>
            </div>
            <div>
              <div className="text-sm text-zinc-500">License ID</div>
              <div className="font-medium">ABC-123456</div>
            </div>
            <div>
              <div className="text-sm text-zinc-500">Organization</div>
              <div className="font-medium">State Board of Counseling</div>
            </div>
          </div>
          <div className="mt-6">
            <div className="text-sm text-zinc-500 mb-2">Uploaded documents</div>
            <ul className="list-disc pl-5 space-y-1">
              {documents.map((d, i) => (
                <li key={i}>
                  <a
                    className="text-sky-600 hover:underline"
                    href={d.url}
                    target="_blank"
                  >
                    {d.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
