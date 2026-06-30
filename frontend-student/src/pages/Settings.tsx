import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Settings = () => {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your workspace and account settings
          </p>
        </div>

        <Tabs defaultValue="workspace" className="space-y-6">
          <TabsList>
            <TabsTrigger value="workspace">Workspace</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
          </TabsList>

          <TabsContent value="workspace" className="space-y-6">
            <div className="card-elevated p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="workspaceName">Workspace Name</Label>
                <Input
                  id="workspaceName"
                  defaultValue="HVAC Corp"
                  placeholder="Enter workspace name"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about your knowledge bases
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <div className="card-elevated p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="john@example.com"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  defaultValue="John Doe"
                  placeholder="Enter your name"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <div className="card-elevated p-6">
              <div className="space-y-4">
                <div>
                  <Label>API Key</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Use this key to access the AI Nexus API
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    defaultValue="sk_live_xxxxxxxxxxxxxxxxxxxx"
                    readOnly
                    className="font-mono"
                  />
                  <Button variant="outline">Reveal</Button>
                  <Button variant="outline">Regenerate</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-8">
          <Button>Save Changes</Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
