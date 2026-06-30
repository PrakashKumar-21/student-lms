import { useEffect, useMemo, useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  getSubscriptionPlans,
  updateSubscriptionPlan,
  type SubscriptionPlan,
} from "@/services/subscriptionApi";

const normalizeFeatures = (value: string) =>
  value
    .split("\n")
    .map((feature) => feature.trim())
    .filter(Boolean);

const Subscriptions = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [amountInr, setAmountInr] = useState("");
  const [interval, setInterval] = useState("month");
  const [maxQueriesPerDay, setMaxQueriesPerDay] = useState("");
  const [maxQueriesPerMonth, setMaxQueriesPerMonth] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");

  const loadPlans = async () => {
    try {
      const data = await getSubscriptionPlans();
      setPlans(data);
    } catch (error) {
      console.error("Failed to load subscription plans", error);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setPrice("");
    setAmountInr("");
    setInterval("month");
    setMaxQueriesPerDay("");
    setMaxQueriesPerMonth("");
    setDescription("");
    setFeatures("");
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedPrice = price.trim();
    const amountValue = Number(amountInr);
    const dailyLimit = maxQueriesPerDay ? Number(maxQueriesPerDay) : undefined;
    const monthlyLimit = maxQueriesPerMonth ? Number(maxQueriesPerMonth) : undefined;
    if (!trimmedName || !trimmedPrice) {
      alert("Plan name and price are required.");
      return;
    }
    if (!Number.isFinite(amountValue) || amountValue < 0) {
      alert("Enter a valid amount in INR (0 for free).");
      return;
    }
    if (
      (dailyLimit !== undefined && (!Number.isFinite(dailyLimit) || dailyLimit <= 0)) ||
      (monthlyLimit !== undefined && (!Number.isFinite(monthlyLimit) || monthlyLimit <= 0))
    ) {
      alert("Enter valid query limits or leave them blank.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        price: trimmedPrice,
        description: description.trim(),
        features: normalizeFeatures(features),
        amount_paise: Math.round(amountValue * 100),
        interval,
        currency: "INR",
        max_queries_per_day: dailyLimit,
        max_queries_per_month: monthlyLimit,
      };
      if (editingId) {
        await updateSubscriptionPlan(editingId, payload);
        alert("Subscription plan updated.");
      } else {
        await createSubscriptionPlan(payload);
        alert("Subscription plan created.");
      }
      resetForm();
      await loadPlans();
    } catch (error) {
      console.error("Failed to save subscription plan", error);
      alert("Failed to save subscription plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingId(plan.id);
    setName(plan.name);
    setPrice(plan.price);
    setAmountInr((plan.amount_paise / 100).toFixed(2));
    setInterval(plan.interval || "month");
    setMaxQueriesPerDay(
      plan.max_queries_per_day ? String(plan.max_queries_per_day) : ""
    );
    setMaxQueriesPerMonth(
      plan.max_queries_per_month ? String(plan.max_queries_per_month) : ""
    );
    setDescription(plan.description ?? "");
    setFeatures(plan.features.join("\n"));
  };

  const handleDelete = async (plan: SubscriptionPlan) => {
    const confirmed = window.confirm(`Delete plan "${plan.name}"?`);
    if (!confirmed) return;
    try {
      await deleteSubscriptionPlan(plan.id);
      await loadPlans();
    } catch (error) {
      console.error("Failed to delete subscription plan", error);
      alert("Failed to delete subscription plan");
    }
  };

  const headerLabel = useMemo(
    () => (editingId ? "Edit Subscription Plan" : "Create Subscription Plan"),
    [editingId],
  );

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Subscriptions
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage subscription plans for students.
            </p>
          </div>
        </div>

        <div className="card-elevated p-6 mb-8">
          <div className="max-w-2xl space-y-4">
            <div className="text-sm font-semibold text-foreground">
              {headerLabel}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="planName">Plan Name</Label>
                <Input
                  id="planName"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g., Pro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planPrice">Price</Label>
                <Input
                  id="planPrice"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="e.g., 299 / month"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planAmount">Amount (INR)</Label>
                <Input
                  id="planAmount"
                  value={amountInr}
                  onChange={(event) => setAmountInr(event.target.value)}
                  placeholder="e.g., 299"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planInterval">Billing Interval</Label>
                <select
                  id="planInterval"
                  value={interval}
                  onChange={(event) => setInterval(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="planDailyLimit">Max Queries / Day</Label>
                <Input
                  id="planDailyLimit"
                  value={maxQueriesPerDay}
                  onChange={(event) => setMaxQueriesPerDay(event.target.value)}
                  placeholder="e.g., 20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planMonthlyLimit">Max Queries / Month</Label>
                <Input
                  id="planMonthlyLimit"
                  value={maxQueriesPerMonth}
                  onChange={(event) => setMaxQueriesPerMonth(event.target.value)}
                  placeholder="e.g., 400"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="planDescription">Description</Label>
              <Textarea
                id="planDescription"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Short description for this plan."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="planFeatures">
                Features (one per line)
              </Label>
              <Textarea
                id="planFeatures"
                value={features}
                onChange={(event) => setFeatures(event.target.value)}
                placeholder={`All subjects\nAI tutor chat\nWeekly mock tests`}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : editingId
                    ? "Update Plan"
                    : "Create Plan"}
              </Button>
              {editingId && (
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="card-elevated p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Existing Plans
          </h2>
          {plans.length ? (
            <div className="space-y-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-lg border border-border bg-background px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {plan.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {plan.price}
                      </div>
                      {plan.description && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {plan.description}
                        </p>
                      )}
                      {(plan.max_queries_per_day || plan.max_queries_per_month) && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {plan.max_queries_per_day && (
                            <span>Daily: {plan.max_queries_per_day} queries</span>
                          )}
                          {plan.max_queries_per_day && plan.max_queries_per_month && (
                            <span> · </span>
                          )}
                          {plan.max_queries_per_month && (
                            <span>Monthly: {plan.max_queries_per_month} queries</span>
                          )}
                        </div>
                      )}
                      {plan.features.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                          {plan.features.map((feature) => (
                            <li key={feature}>• {feature}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleEdit(plan)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDelete(plan)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No subscription plans created yet.
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Subscriptions;
