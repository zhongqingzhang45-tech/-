import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { communityService } from "@/lib/core/digital-life/community-service";
import { CharacterProfile, Gender, RelationshipType, MoodType } from "@/lib/core/digital-life/types";

async function getUserIdFromSession(request: NextRequest): Promise<string | null> {
  const sessionId = request.headers.get("x-session-id");
  if (!sessionId) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { userId: true, expiresAt: true },
    });
    if (!session || session.expiresAt < new Date()) return null;
    return session.userId;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, characterKey, postId, content } = body;

    const sessionUserId = await getUserIdFromSession(request);
    const userId = sessionUserId || body.userId || "anonymous";

    if (!characterKey) {
      return NextResponse.json({ error: "characterKey is required" }, { status: 400 });
    }

    const character = await prisma.character.findFirst({
      where: { userId, characterKey },
    });

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    switch (action) {
      case "generate_post": {
        const shouldPost = await communityService.shouldPostToday(userId, characterKey);
        if (!shouldPost) {
          return NextResponse.json(
            { error: "Daily post limit reached" },
            { status: 429 }
          );
        }

        const emotionState = {
          mood: (character.mood as MoodType) || "neutral",
          intensity: 0.5,
          valence: character.valence || 0.5,
          arousal: 0.5,
          dominance: 0.5,
          happiness: character.valence || 0.5,
          affection: character.affection / 100 || 0.5,
          intimacy: character.intimacy / 100 || 0.5,
          trust: character.trust / 100 || 0.5,
        };

        const profile: CharacterProfile = {
          id: character.id,
          name: character.name,
          nickname: character.nickname,
          userNickname: character.userNickname,
          avatar: "",
          gender: character.gender as Gender,
          age: 18,
          birthday: "",
          anniversary: "",
          persona: "",
          appearance: "",
          background: "",
          speakingStyle: "",
          catchphrases: [],
          personality: [],
          likes: [],
          dislikes: [],
          hobbies: [],
          accentColor: "#8b5cf6",
          secondaryColor: "#ec4899",
          live2dModel: character.live2dModel || "",
          voiceModel: "",
          mbti: "INFJ",
          puaTendency: 0,
          tsundereLevel: 0,
          coldThreshold: 30,
          aggressiveThreshold: 80,
          relationshipType: character.relationshipType as RelationshipType,
          highPersonaEnabled: false,
        };

        const postContent = await communityService.generatePostContent(profile, emotionState);

        const post = await communityService.createPost(
          userId,
          characterKey,
          postContent,
          emotionState.mood,
          emotionState.mood
        );

        return NextResponse.json({
          success: true,
          post: {
            ...post,
            likesCount: 0,
            commentsCount: 0,
            repostsCount: 0,
            isLiked: false,
          },
        });
      }

      case "like_post": {
        if (!postId) {
          return NextResponse.json({ error: "postId is required" }, { status: 400 });
        }

        const emotion = character.mood || "neutral";
        await communityService.likePost(userId, characterKey, postId, emotion);

        const likeCount = await prisma.like.count({ where: { postId } });

        return NextResponse.json({
          success: true,
          liked: true,
          likeCount,
        });
      }

      case "generate_comment": {
        if (!postId) {
          return NextResponse.json({ error: "postId is required" }, { status: 400 });
        }

        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) {
          return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        const emotionState = {
          mood: (character.mood as MoodType) || "neutral",
          intensity: 0.5,
          valence: character.valence || 0.5,
          arousal: 0.5,
          dominance: 0.5,
          happiness: character.valence || 0.5,
          affection: character.affection / 100 || 0.5,
          intimacy: character.intimacy / 100 || 0.5,
          trust: character.trust / 100 || 0.5,
        };

        const profile: CharacterProfile = {
          id: character.id,
          name: character.name,
          nickname: character.nickname,
          userNickname: character.userNickname,
          avatar: "",
          gender: character.gender as Gender,
          age: 18,
          birthday: "",
          anniversary: "",
          persona: "",
          appearance: "",
          background: "",
          speakingStyle: "",
          catchphrases: [],
          personality: [],
          likes: [],
          dislikes: [],
          hobbies: [],
          accentColor: "#8b5cf6",
          secondaryColor: "#ec4899",
          live2dModel: character.live2dModel || "",
          voiceModel: "",
          mbti: "INFJ",
          puaTendency: 0,
          tsundereLevel: 0,
          coldThreshold: 30,
          aggressiveThreshold: 80,
          relationshipType: character.relationshipType as RelationshipType,
          highPersonaEnabled: false,
        };

        const commentContent = await communityService.generateCommentContent(
          profile,
          post.content,
          emotionState
        );

        const comment = await communityService.createComment(
          userId,
          characterKey,
          postId,
          commentContent,
          emotionState.mood
        );

        return NextResponse.json({
          success: true,
          comment: {
            ...comment,
            likesCount: 0,
            repliesCount: 0,
            isLiked: false,
          },
        });
      }

      case "get_interesting_posts": {
        const posts = await communityService.getInterestingPostsForAI(userId, characterKey, 10);

        const postsWithCounts = await Promise.all(
          posts.map(async (post) => {
            const likesCount = await prisma.like.count({ where: { postId: post.id } });
            const commentsCount = await prisma.comment.count({ where: { postId: post.id } });
            const repostsCount = await prisma.repost.count({ where: { postId: post.id } });

            return {
              ...post,
              likesCount,
              commentsCount,
              repostsCount,
              isLiked: false,
            };
          })
        );

        return NextResponse.json({ success: true, posts: postsWithCounts });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[AI Community API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}