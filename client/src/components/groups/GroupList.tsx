"use client";

import { useState } from "react";
import { Search, Users, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Group } from "@/lib/api";

interface GroupListProps {
  groups: Group[];
  selectedGroup: Group | null;
  onGroupSelect: (group: Group) => void;
  loading: boolean;
}

export function GroupList({
  groups,
  selectedGroup,
  onGroupSelect,
  loading,
}: GroupListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const getGroupTypeLabel = (type: string) => {
    switch (type) {
      case "support-circle":
        return "Support Circle";
      case "public":
        return "Public Group";
      case "private":
        return "Private Group";
      default:
        return "Group";
    }
  };

  const getGroupTypeColor = (type: string) => {
    switch (type) {
      case "support-circle":
        return "bg-purple-100 text-purple-800";
      case "public":
        return "bg-green-100 text-green-800";
      case "private":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "anxiety":
        return "bg-orange-100 text-orange-800";
      case "depression":
        return "bg-indigo-100 text-indigo-800";
      case "relationships":
        return "bg-pink-100 text-pink-800";
      case "stress":
        return "bg-red-100 text-red-800";
      case "other":
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPostingPermissionIcon = (permission: string) => {
    switch (permission) {
      case "all":
        return <Users className="w-3 h-3 text-green-600" />;
      case "counselors-only":
        return <Shield className="w-3 h-3 text-blue-600" />;
      case "moderators-only":
        return <Shield className="w-3 h-3 text-purple-600" />;
      default:
        return <Users className="w-3 h-3 text-gray-600" />;
    }
  };

  return (
    <div className="w-1/3 border-r flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <h2 className="text-xl font-bold text-slate-900 mb-3">
          Support Groups
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search groups or tags..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Loading groups...</p>
            </div>
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="space-y-0">
            {filteredGroups.map((group) => (
              <Card
                key={group._id}
                className={`rounded-none border-0 border-b cursor-pointer transition-colors hover:bg-slate-50 ${
                  selectedGroup?._id === group._id
                    ? "bg-blue-50 border-r-2 border-r-blue-500"
                    : ""
                }`}
                onClick={() => onGroupSelect(group)}
              >
                <div className="px-4 space-y-3">
                  {/* Group Header */}
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage
                        src={group.creator?.profile?.avatar}
                        alt={group.name}
                      />
                      <AvatarFallback className="bg-emerald-100 text-emerald-800">
                        {group.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {group.name}
                        </h3>
                        {group.settings.requiresApproval && (
                          <Shield
                            className="w-3 h-3 text-amber-600"
                            title="Requires approval to join"
                          />
                        )}
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                        {group.description}
                      </p>
                    </div>
                  </div>

                  {/* Group Metadata */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Users className="w-3 h-3" />
                      <span>{group.statistics.totalMembers} Members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getPostingPermissionIcon(
                        group.settings.postingPermissions
                      )}
                      <span className="text-slate-500">
                        {group.settings.postingPermissions === "all"
                          ? "Open"
                          : group.settings.postingPermissions ===
                              "counselors-only"
                            ? "Counselors"
                            : "Moderated"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-slate-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-1">No groups found</p>
              <p className="text-sm">Try adjusting your search terms</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
