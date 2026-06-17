"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AvatarCircles } from "@/components/ui/avatar-circles";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface TeamMember {
  name: string;
  imageUrl: string;
  profileUrl: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  status: string;
  teamMembers: TeamMember[];
}

const dummyProjects: Project[] = [
  {
    id: "1",
    name: "ClientHub",
    description: "Centralized client portfolio and engagement tracking",
    updatedAt: "2 days ago",
    status: "Active",
    teamMembers: [
      { name: "Alex", imageUrl: "https://avatars.githubusercontent.com/u/1?v=4", profileUrl: "#" },
      { name: "Jordan", imageUrl: "https://avatars.githubusercontent.com/u/2?v=4", profileUrl: "#" },
      { name: "Casey", imageUrl: "https://avatars.githubusercontent.com/u/3?v=4", profileUrl: "#" },
    ],
  },
  {
    id: "2",
    name: "ResourceOptimizer",
    description: "AI-powered workforce allocation and capacity planning",
    updatedAt: "5 hours ago",
    status: "In Progress",
    teamMembers: [
      { name: "Morgan", imageUrl: "https://avatars.githubusercontent.com/u/4?v=4", profileUrl: "#" },
      { name: "Taylor", imageUrl: "https://avatars.githubusercontent.com/u/5?v=4", profileUrl: "#" },
    ],
  },
  {
    id: "3",
    name: "ComplianceVault",
    description: "Regulatory compliance and risk management platform",
    updatedAt: "1 week ago",
    status: "Review",
    teamMembers: [
      { name: "Sam", imageUrl: "https://avatars.githubusercontent.com/u/6?v=4", profileUrl: "#" },
      { name: "Riley", imageUrl: "https://avatars.githubusercontent.com/u/7?v=4", profileUrl: "#" },
      { name: "Jamie", imageUrl: "https://avatars.githubusercontent.com/u/8?v=4", profileUrl: "#" },
      { name: "Alex", imageUrl: "https://avatars.githubusercontent.com/u/9?v=4", profileUrl: "#" },
    ],
  },
  {
    id: "4",
    name: "InsightsDash",
    description: "Real-time analytics and business intelligence dashboard",
    updatedAt: "3 days ago",
    status: "Active",
    teamMembers: [
      { name: "Dakota", imageUrl: "https://avatars.githubusercontent.com/u/10?v=4", profileUrl: "#" },
      { name: "Phoenix", imageUrl: "https://avatars.githubusercontent.com/u/11?v=4", profileUrl: "#" },
    ],
  },
  {
    id: "5",
    name: "DeliveryTrack",
    description: "Project delivery monitoring and milestone tracking",
    updatedAt: "1 hour ago",
    status: "Active",
    teamMembers: [
      { name: "Skyler", imageUrl: "https://avatars.githubusercontent.com/u/12?v=4", profileUrl: "#" },
      { name: "Drew", imageUrl: "https://avatars.githubusercontent.com/u/13?v=4", profileUrl: "#" },
      { name: "Quinn", imageUrl: "https://avatars.githubusercontent.com/u/14?v=4", profileUrl: "#" },
    ],
  },
  {
    id: "6",
    name: "BillingHub",
    description: "Automated invoicing and revenue recognition system",
    updatedAt: "4 days ago",
    status: "Maintenance",
    teamMembers: [
      { name: "River", imageUrl: "https://avatars.githubusercontent.com/u/15?v=4", profileUrl: "#" },
      { name: "Blake", imageUrl: "https://avatars.githubusercontent.com/u/16?v=4", profileUrl: "#" },
    ],
  },
];

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "In Progress":
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Review: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Maintenance:
    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const handleCreateProject = () => {
    if (projectName.trim()) {
      console.log("Creating project:", { projectName, projectDescription });
      setProjectName("");
      setProjectDescription("");
      setIsDialogOpen(false);
      router.push("/docs");
    }
  };

  const filteredProjects = dummyProjects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8 sm:p-12 lg:p-16">
      <main className="mx-auto" style={{ maxWidth: "700px" }}>
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground mb-8">
            Continue working on your projects or create a new one
          </p>

          <div className="flex gap-2 mb-8">
            <Input
              type="text"
              placeholder="Create or Search for Projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4" data-icon="inline-start" />
              New
            </Button>
          </div>
        </div>

        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-1 p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                      <FolderOpen className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        {project.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <AvatarCircles
                        numPeople={project.teamMembers.length}
                        avatarUrls={project.teamMembers}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={statusColors[project.status]}
                      >
                        {project.status}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{project.updatedAt}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground text-lg">
              No projects found matching "{searchQuery}"
            </p>
          </div>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Enter the project details to get started
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="project-name" className="text-sm font-medium">
                Project Name
              </label>
              <Input
                id="project-name"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="project-description" className="text-sm font-medium">
                Project Description
              </label>
              <Input
                id="project-description"
                placeholder="Enter project description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
