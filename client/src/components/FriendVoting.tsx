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
    const shareData = {
      title: 'Should I Bunk?',
      text: `Help me decide: Should I bunk today's class? Vote here!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast({
          title: "Link Copied!",
          description: "Share link has been copied to your clipboard.",
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
    if (!votes || votes.length === 0) return "No votes yet";
    
    const voteCounts = votes.reduce((acc: Record<string, number>, vote: any) => {
      acc[vote.vote] = (acc[vote.vote] || 0) + 1;
      return acc;
    }, {});

    const bunkCount = voteCounts.bunk || 0;
    const attendCount = voteCounts.attend || 0;
    const riskyCount = voteCounts.risky || 0;

    const parts = [];
    if (bunkCount > 0) parts.push(`${bunkCount} say Bunk`);
    if (attendCount > 0) parts.push(`${attendCount} say Attend`);
    if (riskyCount > 0) parts.push(`${riskyCount} say Risky`);

    return parts.join(", ");
  };

  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Friend Voting</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="text-primary font-semibold"
          >
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
        </div>

        <p className="text-gray-600 mb-4">Ask your friends: "Should I bunk today?"</p>

        {/* Add Vote Form */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Vote as a Friend</h4>
          <div className="space-y-3">
            <Input
              placeholder="Enter your name"
              value={voterName}
              onChange={(e) => setVoterName(e.target.value)}
            />
            <div className="flex space-x-2">
              {[
                { value: 'bunk', label: 'Bunk it!', icon: ThumbsUp },
                { value: 'risky', label: 'Your call', icon: HelpCircle },
                { value: 'attend', label: 'Go to class', icon: ThumbsDown },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedVote(option.value)}
                    className={`flex-1 p-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      selectedVote === option.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-600 hover:border-primary'
                    }`}
                  >
                    <Icon className="w-4 h-4 inline mr-1" />
                    {option.label}
                  </button>
                );
              })}
            </div>
            <Button 
              onClick={handleVoteSubmit}
              disabled={createVoteMutation.isPending || !voterName.trim() || !selectedVote}
              className="w-full"
            >
              {createVoteMutation.isPending ? "Submitting..." : "Submit Vote"}
            </Button>
          </div>
        </div>

        {/* Existing Votes */}
        <div className="space-y-3">
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
          ) : votes && votes.length > 0 ? (
            votes.map((vote: any) => {
              const config = getVoteConfig(vote.vote);
              const Icon = config.icon;
              
              return (
                <div key={vote.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{vote.voterName}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(vote.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${config.color} font-medium`}>
                    <Icon className="w-3 h-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>No votes yet. Be the first to vote!</p>
            </div>
          )}
        </div>

        {/* Vote Consensus */}
        {votes && votes.length > 0 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-primary/5 to-purple-600/5 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">Friend consensus:</p>
              <p className="font-semibold text-secondary">
                {getVoteConsensus()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
