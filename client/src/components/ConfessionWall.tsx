import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Heart, MessageCircle, ChevronDown } from "lucide-react";

export default function ConfessionWall() {
  const [showForm, setShowForm] = useState(false);
  const [confessionText, setConfessionText] = useState("");
  const [offset, setOffset] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: confessions, isLoading } = useQuery({
    queryKey: ["/api/confessions"],
    retry: false,
  });

  const createConfessionMutation = useMutation({
    mutationFn: async (data: { text: string }) => {
      const response = await apiRequest("POST", "/api/confessions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/confessions"] });
      setConfessionText("");
      setShowForm(false);
      toast({
        title: "Confession Posted!",
        description: "Your anonymous confession has been shared.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to post confession. Please try again.",
        variant: "destructive",
      });
    },
  });

  const likeConfessionMutation = useMutation({
    mutationFn: async (confessionId: number) => {
      const response = await apiRequest("POST", `/api/confessions/${confessionId}/like`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/confessions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to like confession.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitConfession = () => {
    if (!confessionText.trim()) {
      toast({
        title: "Empty Confession",
        description: "Please write something before submitting.",
        variant: "destructive",
      });
      return;
    }

    createConfessionMutation.mutate({ text: confessionText.trim() });
  };

  const getConfessionBorderColor = (index: number) => {
    const colors = [
      "border-purple-400",
      "border-blue-400",
      "border-green-400",
      "border-yellow-400",
      "border-pink-400",
      "border-indigo-400",
    ];
    return colors[index % colors.length];
  };

  const getConfessionBgColor = (index: number) => {
    const colors = [
      "from-purple-50 to-pink-50",
      "from-blue-50 to-cyan-50",
      "from-green-50 to-emerald-50",
      "from-yellow-50 to-orange-50",
      "from-pink-50 to-rose-50",
      "from-indigo-50 to-blue-50",
    ];
    return colors[index % colors.length];
  };

  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Confession Wall</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="text-primary font-semibold"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        <p className="text-gray-600 mb-4">Anonymous funny bunk stories from students</p>

        {/* Add Confession Form */}
        {showForm && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-400">
            <h4 className="font-semibold text-gray-900 mb-3">Share Your Confession</h4>
            <Textarea
              placeholder="Share your funny bunk story anonymously..."
              value={confessionText}
              onChange={(e) => setConfessionText(e.target.value)}
              className="mb-3"
              rows={3}
            />
            <div className="flex space-x-2">
              <Button 
                onClick={handleSubmitConfession}
                disabled={createConfessionMutation.isPending}
                size="sm"
              >
                {createConfessionMutation.isPending ? "Posting..." : "Post Anonymously"}
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Confessions List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : confessions && confessions.length > 0 ? (
            confessions.map((confession: any, index: number) => (
              <div 
                key={confession.id} 
                className={`p-4 bg-gradient-to-r ${getConfessionBgColor(index)} rounded-lg border-l-4 ${getConfessionBorderColor(index)}`}
              >
                <p className="text-gray-700 mb-2">{confession.text}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {new Date(confession.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => likeConfessionMutation.mutate(confession.id)}
                      className="flex items-center text-gray-500 hover:text-red-500 transition-colors"
                      disabled={likeConfessionMutation.isPending}
                    >
                      <Heart className="w-4 h-4 mr-1" />
                      <span>{confession.likes || 0}</span>
                    </button>
                    <button className="flex items-center text-gray-500 hover:text-blue-500 transition-colors">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      <span>0</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>No confessions yet. Be the first to share!</p>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {confessions && confessions.length > 0 && (
          <button className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition-colors">
            <ChevronDown className="w-4 h-4 mr-2 inline" />
            Load more confessions
          </button>
        )}
      </CardContent>
    </Card>
  );
}
