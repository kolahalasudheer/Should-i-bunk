import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Share2, ThumbsUp, ThumbsDown, HelpCircle, User } from "lucide-react";

interface FriendVotingProps {
  decisionId: number;
}

export default function FriendVoting({ decisionId }: FriendVotingProps) {
  const [voterName, setVoterName] = useState("");
  const [selectedVote, setSelectedVote] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: votes, isLoading } = useQuery({
    queryKey: ["/api/friend-votes", decisionId],
    retry: false,
  });

  const createVoteMutation = useMutation({
    mutationFn: async (data: { decisionId: number; voterName: string; vote: string }) => {
      const response = await apiRequest("POST", "/api/friend-vote", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-votes", decisionId] });
      setVoterName("");
      setSelectedVote("");
      toast({
        title: "Vote Submitted!",
        description: "Your friend's vote has been recorded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVoteSubmit = () => {
    if (!voterName.trim() || !selectedVote) {
      toast({
        title: "Missing Information",
        description: "Please enter your name and select a vote.",
        variant: "destructive",
      });
      return;
    }

    createVoteMutation.mutate({
      decisionId,
      voterName: voterName.trim(),
      vote: selectedVote,
    });
  };

  const handleShare = async () => {
    const pollUrl = `${window.location.origin}/poll/${decisionId}`;
    const shareData = {
      title: 'Should I Bunk?',
      text: `Help me decide: Should I bunk today's class? Vote here!`,
      url: pollUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast({
          title: "Link Copied!",
          description: "Poll link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Unable to share. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getVoteConfig = (vote: string) => {
    switch (vote) {
      case 'bunk':
        return {
          label: "Bunk it!",
          icon: ThumbsUp,
          color: "bg-secondary/10 text-secondary",
        };
      case 'risky':
        return {
          label: "Your call",
          icon: HelpCircle,
          color: "bg-warning/10 text-warning",
        };
      case 'attend':
        return {
          label: "Go to class",
          icon: ThumbsDown,
          color: "bg-danger/10 text-danger",
        };
      default:
        return {
          label: vote,
          icon: HelpCircle,
          color: "bg-gray-100 text-gray-600",
        };
    }
  };

  const getVoteConsensus = () => {
    if (!votes || !Array.isArray(votes) || votes.length === 0) return { text: "No votes yet", icon: HelpCircle, color: "text-gray-400" };
    const voteCounts = votes.reduce((acc: Record<string, number>, vote: any) => {
      acc[vote.vote] = (acc[vote.vote] || 0) + 1;
      return acc;
    }, {});
    const max = Math.max(voteCounts.bunk || 0, voteCounts.attend || 0, voteCounts.risky || 0);
    let text = "";
    let icon = HelpCircle;
    let color = "";
    if (max === 0) {
      text = "No votes yet";
      color = "text-gray-400";
    } else if (voteCounts.bunk === max) {
      text = `${voteCounts.bunk} say Bunk`;
      icon = ThumbsUp;
      color = "text-primary";
    } else if (voteCounts.attend === max) {
      text = `${voteCounts.attend} say Attend`;
      icon = ThumbsDown;
      color = "text-danger";
    } else if (voteCounts.risky === max) {
      text = `${voteCounts.risky} say Risky`;
      icon = HelpCircle;
      color = "text-warning";
    }
    return { text, icon, color };
  };
  const consensus = getVoteConsensus();

  return (
    <Card className="border-none shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md animate-fade-in-up">
      <CardContent className="p-6">
        {/* Consensus summary */}
        <div className="flex items-center justify-between mb-4 animate-fade-in-down">
          <div className="flex items-center gap-2">
            <span className={`rounded-full p-2 bg-gradient-to-tr from-primary to-purple-600 ${consensus.color}`}>
              <consensus.icon className="w-5 h-5 text-white" />
            </span>
            <span className={`font-semibold text-lg ${consensus.color}`}>{consensus.text}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="text-primary font-semibold border-primary border-2 bg-white/70 hover:bg-primary/10 shadow-md transition-all animate-fade-in-up"
          >
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
        </div>

        <p className="text-gray-600 mb-4">Ask your friends: "Should I bunk today?"</p>

        {/* Add Vote Form */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl animate-fade-in-up shadow">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Vote as a Friend</h4>
          <div className="space-y-3">
            <Input
              placeholder="Enter your name"
              value={voterName}
              onChange={(e) => setVoterName(e.target.value)}
              className="rounded-lg shadow-sm"
            />
            <div className="flex space-x-2">
              {[
                { value: 'bunk', label: 'Bunk it!', icon: ThumbsUp, gradient: 'from-primary to-purple-600' },
                { value: 'risky', label: 'Your call', icon: HelpCircle, gradient: 'from-yellow-400 to-yellow-600' },
                { value: 'attend', label: 'Go to class', icon: ThumbsDown, gradient: 'from-red-500 to-pink-500' },
              ].map((option) => {
                const Icon = option.icon;
                const isSelected = selectedVote === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedVote(option.value)}
                    className={`flex-1 p-2 rounded-lg border-2 text-sm font-medium transition-all duration-200 flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm
                      ${isSelected
                        ? `border-primary bg-gradient-to-r ${option.gradient} text-white scale-105 shadow-lg`
                        : 'border-gray-200 text-gray-600 hover:border-primary hover:scale-105 hover:bg-primary/5'}
                    `}
                    style={{ minWidth: 0 }}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'animate-fade-in-up' : ''}`} />
                    {option.label}
                  </button>
                );
              })}
            </div>
            <Button 
              onClick={handleVoteSubmit}
              disabled={createVoteMutation.isPending || !voterName.trim() || !selectedVote}
              className="w-full bg-gradient-to-r from-primary via-fuchsia-500 to-purple-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:scale-105 transition-all"
            >
              {createVoteMutation.isPending ? "Submitting..." : "Submit Vote"}
            </Button>
          </div>
        </div>

        {/* Existing Votes */}
        <div className="space-y-3 animate-fade-in-up">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : Array.isArray(votes) && votes.length > 0 ? (
            votes.map((vote: any) => {
              const config = getVoteConfig(vote.vote);
              const Icon = config.icon;
              return (
                <div key={vote.id} className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-800/60 rounded-xl shadow-sm transition-all animate-fade-in-up">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{vote.voterName}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {new Date(vote.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${config.color} font-medium flex items-center gap-1 px-2 py-1 rounded-lg`}>
                    <Icon className="w-3 h-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-gray-500">
              No votes yet. Share the link with your friends!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
