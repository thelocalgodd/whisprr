"use client";
import { useState } from "react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDownToLine, Eye, Video } from "lucide-react";

interface Resource {
  _id: string;
  title: string;
  description: string;
  type: "article" | "video" | "downloadable";
  url: string;
  fileName?: string;
}

const ResourceIcon = ({ type }: { type: Resource["type"] }) => {
  switch (type) {
    case "article":
      return <Eye className="w-5 h-5" />;
    case "video":
      return <Video className="w-5 h-5" />;
    case "downloadable":
      return <ArrowDownToLine className="w-5 h-5" />;
    default:
      return null;
  }
};

const ResourcesPage = () => {
  const [resources, setResources] = useState<Resource[]>([]);


  const handleView = (url: string) => {
    window.open(url, "_blank");
  };

  const handleDownload = (url: string, fileName?: string) => {
    const link = document.createElement("a");
    link.href = url;
    if (fileName) {
      link.setAttribute("download", fileName);
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Resources</h1>
      </div>
      <div className="flex flex-col gap-4">
        {resources.length > 0 ? (
          resources.map((resource) => (
            <Card key={resource._id} className="flex flex-row items-center">
              <CardHeader className="flex-grow">
                <div className="flex gap-4 items-center">
                  <CardTitle className="text-lg font-semibold">
                    {resource.title}
                  </CardTitle>
                  <Badge variant="outline" className="capitalize">
                    <ResourceIcon type={resource.type} />
                    <span className="ml-2">{resource.type}</span>
                  </Badge>
                </div>
                <CardDescription className="text-sm text-gray-600 pt-2">
                  {resource.description}
                </CardDescription>
              </CardHeader>
              <CardFooter className="w-48 flex-shrink-0">
                {resource.type === "downloadable" ? (
                  <Button
                    onClick={() =>
                      handleDownload(resource.url, resource.fileName)
                    }
                    className="w-full"
                  >
                    <ArrowDownToLine className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleView(resource.url)}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No resources available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcesPage;
