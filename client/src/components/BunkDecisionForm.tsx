import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CloudSun, Sparkles } from "lucide-react";

const formSchema = z.object({
  attendancePercentage: z.number().min(0).max(100),
  mood: z.enum(["tired", "lazy", "energetic"]),
  daysUntilExam: z.number().min(1).max(365),
  professorStrictness: z.enum(["chill", "moderate", "strict"]),
});

interface BunkDecisionFormProps {
  onDecisionMade: (decision: any) => void;
}

export default function BunkDecisionForm({ onDecisionMade }: BunkDecisionFormProps) {
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedStrictness, setSelectedStrictness] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: weather } = useQuery({
    queryKey: ["/api/weather"],
    retry: false,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      attendancePercentage: 78,
      mood: "lazy",
      daysUntilExam: 7,
      professorStrictness: "moderate",
    },
  });

  const createDecisionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/bunk-decision", data);
      return response.json();
    },
    onSuccess: (data) => {
      onDecisionMade(data);
      toast({
        title: "Decision Made!",
        description: "Your bunk decision has been calculated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to calculate your decision. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createDecisionMutation.mutate(data);
  };

  const moodOptions = [
    { value: "tired", label: "Tired", icon: "fas fa-tired" },
    { value: "lazy", label: "Lazy", icon: "fas fa-meh" },
    { value: "energetic", label: "Energetic", icon: "fas fa-smile" },
  ];

  const strictnessOptions = [
    { value: "chill", label: "Chill", icon: "fas fa-smile", color: "text-secondary" },
    { value: "moderate", label: "Moderate", icon: "fas fa-meh", color: "text-warning" },
    { value: "strict", label: "Strict", icon: "fas fa-frown", color: "text-danger" },
  ];

  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Make Your Decision</h2>
          <p className="text-gray-600">Let's help you decide whether to bunk today's class</p>
        </div>

        {/* Weather Card */}
        {weather && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <CloudSun className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{weather.condition}</p>
                  <p className="text-xs text-gray-600">{weather.location}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{weather.temperature}°C</p>
                <p className="text-xs text-gray-600">
                  {weather.isBunkWeather ? "Perfect for bunking" : "Good weather"}
                </p>
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Attendance Percentage */}
            <FormField
              control={form.control}
              name="attendancePercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Attendance %</FormLabel>
                  <FormControl>
                    <div className="px-2">
                      <Slider
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                        max={100}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span className="font-medium text-gray-900">{field.value}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mood */}
            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How are you feeling?</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-3 gap-2">
                      {moodOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            field.onChange(option.value);
                            setSelectedMood(option.value);
                          }}
                          className={`flex flex-col items-center p-3 rounded-lg border-2 transition-colors ${
                            field.value === option.value
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-primary'
                          }`}
                        >
                          <i className={`${option.icon} text-2xl mb-1 ${
                            field.value === option.value ? 'text-primary' : 'text-gray-400'
                          }`}></i>
                          <span className={`text-xs ${
                            field.value === option.value ? 'text-primary font-medium' : 'text-gray-600'
                          }`}>
                            {option.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Days Until Exam */}
            <FormField
              control={form.control}
              name="daysUntilExam"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Days until next exam</FormLabel>
                  <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select days until exam" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Tomorrow (1 day)</SelectItem>
                      <SelectItem value="3">This week (3 days)</SelectItem>
                      <SelectItem value="7">Next week (7 days)</SelectItem>
                      <SelectItem value="14">2 weeks away</SelectItem>
                      <SelectItem value="30">1 month away</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Professor Strictness */}
            <FormField
              control={form.control}
              name="professorStrictness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professor strictness level</FormLabel>
                  <FormControl>
                    <div className="flex space-x-2">
                      {strictnessOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            field.onChange(option.value);
                            setSelectedStrictness(option.value);
                          }}
                          className={`flex-1 p-3 rounded-lg border-2 font-medium transition-colors ${
                            field.value === option.value
                              ? `border-${option.color.replace('text-', '')} bg-${option.color.replace('text-', '')}/5 ${option.color}`
                              : 'border-gray-200 text-gray-600 hover:border-primary'
                          }`}
                        >
                          <i className={`${option.icon} mr-2`}></i>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all"
              disabled={createDecisionMutation.isPending}
            >
              <Sparkles className="mr-2" />
              {createDecisionMutation.isPending ? "Calculating..." : "Should I Bunk?"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
