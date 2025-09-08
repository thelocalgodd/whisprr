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
import {
  ArrowDownToLine,
  Eye,
  Video,
  FileText,
  Link as LinkIcon,
  VolumeX,
  ToolCaseIcon,
} from "lucide-react";

const ResourceIcon = ({ type }: { type: Resource["type"] }) => {
  switch (type) {
    case "article":
      return <FileText className="w-5 h-5" />;
    case "video":
      return <Video className="w-5 h-5" />;
    case "audio":
      return <VolumeX className="w-5 h-5" />;
    case "pdf":
      return <ArrowDownToLine className="w-5 h-5" />;
    case "link":
      return <LinkIcon className="w-5 h-5" />;
    case "tool":
      return <ToolCaseIcon className="w-5 h-5" />;
    default:
      return <Eye className="w-5 h-5" />;
  }
};

interface Resource {
  _id: string;
  title: string;
  description: string;
  type: "article" | "video" | "audio" | "pdf" | "link" | "tool";
  url: string;
  category: string;
  views: number;
  likesCount: number;
  createdBy: {
    username: string;
  };
}

const ResourcesPage = () => {
  const [resources] = useState<Resource[]>([]);

  const handleView = (resource: Resource) => {
    window.open(resource.url, "_blank");
  };

  const handleLike = (resourceId: string) => {
    console.log("Like resource:", resourceId);
  };


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Resources</h1>
        <p className="text-sm text-muted-foreground">
          {resources.length} resources available
        </p>
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
                  <Badge variant="secondary">{resource.category}</Badge>
                </div>
                <CardDescription className="text-sm text-gray-600 pt-2">
                  {resource.description}
                </CardDescription>
                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                  <span>{resource.views} views</span>
                  <span>By {resource.createdBy.username}</span>
                  {resource.likesCount > 0 && (
                    <span>{resource.likesCount} likes</span>
                  )}
                </div>
              </CardHeader>
              <CardFooter className="w-48 flex-shrink-0 space-y-2">
                <Button onClick={() => handleView(resource)} className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  {resource.type === "pdf" ? "Download" : "View"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLike(resource._id)}
                  className="w-full"
                >
                  👍 Like
                </Button>
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
