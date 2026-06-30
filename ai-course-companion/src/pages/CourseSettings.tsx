import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Copy, Check, Globe, Code } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CourseSettings = () => {
  const { id } = useParams();
  const [courseName, setCourseName] = useState("Advanced Heat Pumps");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are an expert HVAC technician assistant. Answer questions based on the provided training materials. Be concise, accurate, and always prioritize safety information."
  );
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);

  const embedCode = `<script src="https://ai-nexus.app/embed/${id}.js"></script>
<div id="ai-nexus-chat" data-course="${id}"></div>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/course/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Course Settings
            </h1>
            <p className="text-muted-foreground">
              Configure your AI assistant's behavior and deployment
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="model">Model Config</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <div className="card-elevated p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="courseName">Course Name</Label>
                <Input
                  id="courseName"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="Enter course name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <p className="text-xs text-muted-foreground">
                  Define how the AI behaves and responds to questions
                </p>
                <Textarea
                  id="systemPrompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="You are a helpful assistant..."
                  rows={6}
                  className="resize-none"
                />
              </div>
            </div>
          </TabsContent>

          {/* Model Config Tab */}
          <TabsContent value="model" className="space-y-6">
            <div className="card-elevated p-6 space-y-6">
              <div className="space-y-2">
                <Label>Model Selection</Label>
                <p className="text-sm text-muted-foreground">
                  Choose the AI model for your assistant
                </p>
                <div className="grid gap-3 mt-3">
                  {[
                    { name: "GPT-4o", desc: "Most capable, best for complex queries", recommended: true },
                    { name: "GPT-4o-mini", desc: "Fast and cost-effective" },
                    { name: "Claude 3.5 Sonnet", desc: "Excellent reasoning and safety" },
                  ].map((model) => (
                    <label
                      key={model.name}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="model"
                        defaultChecked={model.recommended}
                        className="accent-primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {model.name}
                          </span>
                          {model.recommended && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {model.desc}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Temperature</Label>
                <p className="text-xs text-muted-foreground">
                  Lower values make responses more focused, higher values more creative
                </p>
                <Input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  defaultValue="0.3"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Focused (0)</span>
                  <span>Creative (1)</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Deployment Tab */}
          <TabsContent value="deployment" className="space-y-6">
            <div className="card-elevated p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label>Make Bot Public</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow anyone with the link to access this assistant
                    </p>
                  </div>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>

              <div className="border-t border-border pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-muted-foreground" />
                  <Label>Embed Code</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add this code to your website to embed the chat widget
                </p>
                <div className="relative">
                  <pre className="bg-sidebar text-sidebar-foreground p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{embedCode}</code>
                  </pre>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="sticky bottom-0 py-4 bg-background border-t border-border mt-8 -mx-8 px-8">
          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link to={`/course/${id}`}>Cancel</Link>
            </Button>
            <Button>Save Changes</Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CourseSettings;
