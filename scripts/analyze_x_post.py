#!/usr/bin/env python3
"""
X Algorithm Post Analyzer

Analyzes posts against X's Phoenix + Thunder weighted scorer mechanics.
Based on analysis of the xai-org/x-algorithm codebase.

Usage:
    from analyze_x_post import analyze_post, format_report, calculate_weighted_score
    result = analyze_post("Your post text here", include_media=True)
    print(format_report(result))

    # Or calculate raw weighted score
    score = calculate_weighted_score(p_reply=0.15, p_like=0.08, p_block=0.001)
"""

import re
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum


# === CONFIGURATION: Inferred weights from algorithm analysis ===

class ActionWeights:
    """Estimated weights from weighted scorer analysis."""
    # Tier 1: Multipliers
    REPLY = 15.0
    REPOST = 12.0
    QUOTE = 10.0

    # Tier 2: Validators
    LIKE = 1.0
    VIDEO_VIEW = 1.2
    PHOTO_EXPAND = 1.0
    BOOKMARK = 1.5

    # Tier 3: Signals
    CLICK = 0.3
    DWELL = 0.5
    PROFILE_CLICK = 0.4

    # Tier 4: Destroyers
    BLOCK = -1000.0
    MUTE = -500.0
    REPORT = -2000.0
    NOT_INTERESTED = -100.0


class PostType(Enum):
    """Detected post type for template matching."""
    OPEN_QUESTION = "open_question"
    FILL_BLANK = "fill_in_the_blank"
    CONTRARIAN = "contrarian_take"
    DATA_DROP = "data_drop"
    THREAD_HOOK = "thread_hook"
    FRAMEWORK = "framework"
    MISTAKE_ADMISSION = "mistake_admission"
    LIST = "rapid_fire_list"
    LINK_DUMP = "link_dump"
    GENERIC = "generic"


@dataclass
class ProbabilityEstimates:
    """Estimated engagement probabilities."""
    p_reply: float = 0.0
    p_repost: float = 0.0
    p_quote: float = 0.0
    p_like: float = 0.0
    p_video_view: float = 0.0
    p_photo_expand: float = 0.0
    p_bookmark: float = 0.0
    p_click: float = 0.0
    p_profile_click: float = 0.0
    p_block: float = 0.0
    p_mute: float = 0.0
    p_report: float = 0.0


@dataclass
class AnalysisResult:
    """Comprehensive analysis results."""

    # Weighted scorer output
    weighted_score: float
    score_breakdown: dict

    # Component scores (0-100)
    reply_potential: int
    shareability: int
    media_optimization: int
    negative_signal_safety: int
    overall_score: int

    # Detected patterns
    post_type: PostType
    detected_patterns: list

    # Probability estimates
    probabilities: ProbabilityEstimates

    # Feedback
    strengths: list
    weaknesses: list
    suggestions: list

    # Metadata
    char_count: int
    word_count: int
    has_question: bool
    has_media: bool
    media_type: Optional[str]


def calculate_weighted_score(
    p_reply: float = 0.0,
    p_repost: float = 0.0,
    p_quote: float = 0.0,
    p_like: float = 0.0,
    p_video_view: float = 0.0,
    p_photo_expand: float = 0.0,
    p_bookmark: float = 0.0,
    p_click: float = 0.0,
    p_profile_click: float = 0.0,
    p_block: float = 0.0,
    p_mute: float = 0.0,
    p_report: float = 0.0,
) -> tuple[float, dict]:
    """
    Calculate the weighted score using the formula: Score = Σ (w_i × P(action_i))

    Returns:
        Tuple of (total_score, breakdown_dict)
    """
    breakdown = {
        "reply": ActionWeights.REPLY * p_reply,
        "repost": ActionWeights.REPOST * p_repost,
        "quote": ActionWeights.QUOTE * p_quote,
        "like": ActionWeights.LIKE * p_like,
        "video_view": ActionWeights.VIDEO_VIEW * p_video_view,
        "photo_expand": ActionWeights.PHOTO_EXPAND * p_photo_expand,
        "bookmark": ActionWeights.BOOKMARK * p_bookmark,
        "click": ActionWeights.CLICK * p_click,
        "profile_click": ActionWeights.PROFILE_CLICK * p_profile_click,
        "block": ActionWeights.BLOCK * p_block,
        "mute": ActionWeights.MUTE * p_mute,
        "report": ActionWeights.REPORT * p_report,
    }

    total = sum(breakdown.values())
    return total, breakdown


def detect_post_type(text: str) -> tuple[PostType, list]:
    """Detect the post type and patterns used."""
    text_lower = text.lower()
    detected = []

    # Fill-in-the-blank (highest priority)
    fill_patterns = [r"___", r"complete the sentence", r"fill in"]
    if any(re.search(p, text_lower) for p in fill_patterns):
        detected.append("fill_in_the_blank")
        return PostType.FILL_BLANK, detected

    # Open question
    open_q_patterns = [
        r"what('s| is| are) your",
        r"what do you",
        r"how do you",
        r"which (one|do you)",
        r"what's yours\?",
        r"agree or disagree",
        r"thoughts\?$",
    ]
    if any(re.search(p, text_lower) for p in open_q_patterns):
        detected.append("open_question")
        return PostType.OPEN_QUESTION, detected

    # Contrarian/Hot take
    contrarian_patterns = [
        r"unpopular opinion",
        r"hot take",
        r"controversial",
        r"most people (think|believe|get wrong)",
    ]
    if any(re.search(p, text_lower) for p in contrarian_patterns):
        detected.append("contrarian_take")
        return PostType.CONTRARIAN, detected

    # Thread hook
    if "🧵" in text or re.search(r"thread|here's (the|my|a) (playbook|system|framework)", text_lower):
        detected.append("thread_hook")
        return PostType.THREAD_HOOK, detected

    # Data drop
    if re.search(r"\d+%|\d+ (percent|out of)", text_lower) and re.search(r"(analyzed|studied|found|shows)", text_lower):
        detected.append("data_drop")
        return PostType.DATA_DROP, detected

    # Framework
    if re.search(r"(the \w+ framework|framework:|\d\.\s|\d\)\s)", text_lower):
        detected.append("framework")
        return PostType.FRAMEWORK, detected

    # Mistake admission
    if re.search(r"(biggest mistake|i was wrong|i failed|lesson learned)", text_lower):
        detected.append("mistake_admission")
        return PostType.MISTAKE_ADMISSION, detected

    # List
    if re.search(r"^\d+[\.\)]\s", text, re.MULTILINE) or re.search(r"\d+ (tips|lessons|things|ways)", text_lower):
        detected.append("rapid_fire_list")
        return PostType.LIST, detected

    # Link dump (anti-pattern)
    url_pattern = r"https?://\S+"
    if re.search(url_pattern, text):
        text_no_url = re.sub(url_pattern, "", text).strip()
        if len(text_no_url) < 50:
            detected.append("link_dump")
            return PostType.LINK_DUMP, detected

    return PostType.GENERIC, detected


def analyze_reply_potential(text: str, post_type: PostType) -> tuple[int, list, list, list]:
    """Analyze P(reply) optimization. Returns (score, strengths, weaknesses, suggestions)."""
    score = 40  # Base
    strengths, weaknesses, suggestions = [], [], []
    text_lower = text.lower()

    # Post type bonuses
    type_bonuses = {
        PostType.FILL_BLANK: (40, "Fill-in-the-blank format (highest P(reply) potential, est. 20-35%)"),
        PostType.OPEN_QUESTION: (30, "Open question inviting specific responses (est. P(reply) 15-25%)"),
        PostType.CONTRARIAN: (20, "Contrarian framing invites debate from both sides"),
        PostType.MISTAKE_ADMISSION: (15, "Vulnerability invites reciprocal sharing"),
    }

    if post_type in type_bonuses:
        bonus, strength = type_bonuses[post_type]
        score += bonus
        strengths.append(strength)

    # Question detection
    has_question = "?" in text
    if has_question:
        q_count = text.count("?")
        if q_count == 1:
            score += 10
        elif q_count > 2:
            score -= 5
            weaknesses.append("Multiple questions dilute focus")
            suggestions.append("Focus on one compelling question")
    else:
        if post_type not in [PostType.FILL_BLANK, PostType.DATA_DROP, PostType.FRAMEWORK]:
            weaknesses.append("No question or clear invitation to reply")
            suggestions.append("Add an open-ended question to boost P(reply)")

    # "Complete" post detection (bad)
    complete_patterns = [r"in conclusion", r"to summarize", r"that's all", r"the end\."]
    if any(re.search(p, text_lower) for p in complete_patterns):
        score -= 15
        weaknesses.append("Post feels 'complete' — leaves no room for discussion")
        suggestions.append("Leave something open-ended or debatable")

    # Nuance detection (good for contrarian)
    nuance_patterns = [r"but here's", r"however", r"that said", r"it depends", r"the nuance"]
    has_nuance = any(re.search(p, text_lower) for p in nuance_patterns)
    if post_type == PostType.CONTRARIAN:
        if has_nuance:
            score += 10
            strengths.append("Nuanced contrarian take reduces P(block) while maintaining debate")
        else:
            score -= 10
            weaknesses.append("Contrarian without nuance may generate blocks alongside replies")
            suggestions.append("Add nuance: 'But here's the thing...' or 'However...'")

    return max(0, min(100, score)), strengths, weaknesses, suggestions


def analyze_shareability(text: str, post_type: PostType) -> tuple[int, list, list, list]:
    """Analyze P(repost) and P(quote) optimization."""
    score = 40
    strengths, weaknesses, suggestions = [], [], []
    text_lower = text.lower()

    # High shareability patterns
    if post_type == PostType.DATA_DROP:
        score += 25
        strengths.append("Data-driven insight (high P(repost) — sharers look smart)")
    elif post_type == PostType.FRAMEWORK:
        score += 20
        strengths.append("Framework format is highly bookmarkable and shareable")
    elif post_type == PostType.THREAD_HOOK:
        score += 15
        strengths.append("Thread format signals depth and value")

    # Specific numbers
    if re.search(r"\d{2,}", text):
        score += 10
        strengths.append("Specific numbers add credibility and quotability")

    # Value indicators
    value_patterns = [
        r"here's (the|my|a) (playbook|framework|system|secret)",
        r"i (analyzed|studied|spent \d+)",
        r"\d+ (tips|lessons|things|ways|steps)",
    ]
    if any(re.search(p, text_lower) for p in value_patterns):
        score += 15
        strengths.append("Clear value proposition makes sharing worthwhile")

    # Link dump penalty
    if post_type == PostType.LINK_DUMP:
        score -= 35
        weaknesses.append("Link-only post has no standalone value to share")
        suggestions.append("Add context, insights, or a key takeaway around the link")

    return max(0, min(100, score)), strengths, weaknesses, suggestions


def analyze_media(include_media: bool, media_type: Optional[str]) -> tuple[int, list, list, list]:
    """Analyze media optimization."""
    strengths, weaknesses, suggestions = [], [], []

    if not include_media:
        weaknesses.append("No media — forfeits P(video_view) and P(photo_expand) probability terms")
        suggestions.append("Add an image or video to access additional scoring terms")
        return 25, strengths, weaknesses, suggestions

    strengths.append("Includes media (accesses additional probability terms in weighted scorer)")

    if media_type == "video":
        suggestions.append("Ensure hook in first 2-3 seconds (before scroll-away)")
        suggestions.append("Add captions — 80% watch muted")
        return 85, strengths, weaknesses, suggestions
    elif media_type == "image":
        suggestions.append("Consider vertical aspect ratio (gets cropped → forces P(photo_expand))")
        return 75, strengths, weaknesses, suggestions
    else:
        return 70, strengths, weaknesses, suggestions


def analyze_negative_signals(text: str, post_type: PostType) -> tuple[int, float, list, list, list]:
    """Analyze P(block) risk. Returns (safety_score, est_p_block, strengths, weaknesses, suggestions)."""
    risk_score = 10  # Lower is better
    strengths, weaknesses, suggestions = [], [], []
    text_lower = text.lower()

    # Rage-bait indicators
    rage_patterns = [
        (r"\b(idiot|stupid|dumb|moron)s?\b", 30, "Contains potentially offensive language"),
        (r"\b(wake up|sheep|sheeple)\b", 25, "Dismissive language may trigger blocks"),
        (r"\byou('re| are) (all )?wrong\b", 20, "Accusatory framing increases P(block)"),
    ]

    for pattern, penalty, message in rage_patterns:
        if re.search(pattern, text_lower):
            risk_score += penalty
            weaknesses.append(message)
            suggestions.append("Remove inflammatory language — one block ≈ -1000 likes")

    # All-caps aggression
    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    if caps_ratio > 0.3:
        risk_score += 15
        weaknesses.append("Heavy caps usage feels aggressive")
        suggestions.append("Use emphasis sparingly")

    # Contrarian without nuance
    if post_type == PostType.CONTRARIAN:
        nuance_patterns = [r"but here's", r"however", r"that said", r"nuance"]
        if not any(re.search(p, text_lower) for p in nuance_patterns):
            risk_score += 15

    # Positive signals
    if post_type == PostType.MISTAKE_ADMISSION:
        risk_score -= 10
        strengths.append("Vulnerability is nearly impossible to block — very safe format")

    # Calculate estimated P(block)
    est_p_block = max(0.001, min(0.05, risk_score / 2000))

    # Safety score (inverted for display)
    safety_score = max(0, min(100, 100 - risk_score))

    return safety_score, est_p_block, strengths, weaknesses, suggestions


def estimate_probabilities(
    text: str,
    post_type: PostType,
    reply_score: int,
    share_score: int,
    media_score: int,
    safety_score: int,
    include_media: bool,
    media_type: Optional[str],
) -> ProbabilityEstimates:
    """Estimate engagement probabilities based on analysis."""

    # Base estimates from scores (rough heuristics)
    p_reply = min(0.35, reply_score / 300)
    p_repost = min(0.15, share_score / 700)
    p_quote = min(0.08, share_score / 1000)
    p_like = min(0.20, (reply_score + share_score) / 500)
    p_bookmark = min(0.10, share_score / 800)
    p_profile_click = min(0.08, share_score / 1000)
    p_click = min(0.15, 0.05)  # Low and stable

    # Media probabilities
    p_video_view = 0.0
    p_photo_expand = 0.0
    if include_media:
        if media_type == "video":
            p_video_view = min(0.25, media_score / 400)
        else:
            p_photo_expand = min(0.20, media_score / 450)

    # Negative signal estimates
    p_block = max(0.001, (100 - safety_score) / 5000)
    p_mute = p_block * 0.5
    p_report = p_block * 0.1

    # Post type adjustments
    type_adjustments = {
        PostType.FILL_BLANK: {"p_reply": 1.5},
        PostType.OPEN_QUESTION: {"p_reply": 1.3},
        PostType.DATA_DROP: {"p_repost": 1.4, "p_bookmark": 1.5},
        PostType.THREAD_HOOK: {"p_bookmark": 1.5, "p_profile_click": 1.4},
        PostType.CONTRARIAN: {"p_reply": 1.2, "p_quote": 1.3, "p_block": 1.5},
        PostType.LINK_DUMP: {"p_reply": 0.3, "p_repost": 0.3, "p_like": 0.4},
    }

    if post_type in type_adjustments:
        for key, mult in type_adjustments[post_type].items():
            if key == "p_reply":
                p_reply = min(0.35, p_reply * mult)
            elif key == "p_repost":
                p_repost = min(0.15, p_repost * mult)
            elif key == "p_quote":
                p_quote = min(0.08, p_quote * mult)
            elif key == "p_bookmark":
                p_bookmark = min(0.12, p_bookmark * mult)
            elif key == "p_profile_click":
                p_profile_click = min(0.10, p_profile_click * mult)
            elif key == "p_like":
                p_like = min(0.25, p_like * mult)
            elif key == "p_block":
                p_block = min(0.05, p_block * mult)

    return ProbabilityEstimates(
        p_reply=p_reply,
        p_repost=p_repost,
        p_quote=p_quote,
        p_like=p_like,
        p_video_view=p_video_view,
        p_photo_expand=p_photo_expand,
        p_bookmark=p_bookmark,
        p_click=p_click,
        p_profile_click=p_profile_click,
        p_block=p_block,
        p_mute=p_mute,
        p_report=p_report,
    )


def analyze_post(
    text: str,
    include_media: bool = False,
    media_type: Optional[str] = None,
    is_thread_start: bool = False,
) -> AnalysisResult:
    """
    Comprehensive post analysis against X's weighted scorer mechanics.

    Args:
        text: The post text to analyze
        include_media: Whether the post includes media (image or video)
        media_type: "image", "video", or None
        is_thread_start: Whether this is the first tweet of a thread

    Returns:
        AnalysisResult with scores, probabilities, and recommendations
    """
    # Metadata
    char_count = len(text)
    word_count = len(text.split())
    has_question = "?" in text

    # Detect post type
    post_type, detected_patterns = detect_post_type(text)

    # Component analysis
    reply_score, reply_str, reply_weak, reply_sug = analyze_reply_potential(text, post_type)
    share_score, share_str, share_weak, share_sug = analyze_shareability(text, post_type)
    media_score, media_str, media_weak, media_sug = analyze_media(include_media, media_type)
    safety_score, est_p_block, safety_str, safety_weak, safety_sug = analyze_negative_signals(text, post_type)

    # Combine feedback
    strengths = reply_str + share_str + media_str + safety_str
    weaknesses = reply_weak + share_weak + media_weak + safety_weak
    suggestions = reply_sug + share_sug + media_sug + safety_sug

    # Character count analysis
    if char_count < 50:
        weaknesses.append(f"Very short ({char_count} chars) — may lack substance")
    elif 71 <= char_count <= 100:
        strengths.append(f"Optimal length ({char_count} chars) — highest engagement per character")
    elif char_count > 280:
        weaknesses.append(f"Long post ({char_count} chars) — requires 'Show more' click")

    # Estimate probabilities
    probs = estimate_probabilities(
        text, post_type, reply_score, share_score, media_score, safety_score,
        include_media, media_type
    )

    # Calculate weighted score
    weighted_score, score_breakdown = calculate_weighted_score(
        p_reply=probs.p_reply,
        p_repost=probs.p_repost,
        p_quote=probs.p_quote,
        p_like=probs.p_like,
        p_video_view=probs.p_video_view,
        p_photo_expand=probs.p_photo_expand,
        p_bookmark=probs.p_bookmark,
        p_click=probs.p_click,
        p_profile_click=probs.p_profile_click,
        p_block=probs.p_block,
        p_mute=probs.p_mute,
        p_report=probs.p_report,
    )

    # Overall score (0-100 scale for readability)
    overall_score = int(
        reply_score * 0.40 +
        share_score * 0.25 +
        media_score * 0.15 +
        safety_score * 0.20
    )

    return AnalysisResult(
        weighted_score=weighted_score,
        score_breakdown=score_breakdown,
        reply_potential=reply_score,
        shareability=share_score,
        media_optimization=media_score,
        negative_signal_safety=safety_score,
        overall_score=overall_score,
        post_type=post_type,
        detected_patterns=detected_patterns,
        probabilities=probs,
        strengths=strengths,
        weaknesses=weaknesses,
        suggestions=suggestions,
        char_count=char_count,
        word_count=word_count,
        has_question=has_question,
        has_media=include_media,
        media_type=media_type,
    )


def format_report(result: AnalysisResult, verbose: bool = True) -> str:
    """Format analysis into readable report."""
    lines = []

    # Header with verdict
    if result.weighted_score >= 2.0:
        emoji, verdict = "🟢", "Strong — Viral Potential"
    elif result.weighted_score >= 1.0:
        emoji, verdict = "🟢", "Good — Should Perform Well"
    elif result.weighted_score >= 0.3:
        emoji, verdict = "🟡", "Moderate — Room for Improvement"
    elif result.weighted_score >= 0.0:
        emoji, verdict = "🟠", "Weak — Needs Optimization"
    else:
        emoji, verdict = "🔴", "Negative Score — Will Be Demoted"

    lines.append(f"{emoji} **Weighted Score: {result.weighted_score:.2f}** ({verdict})")
    lines.append(f"**Post Type Detected**: {result.post_type.value.replace('_', ' ').title()}")
    lines.append("")

    if verbose:
        # Score breakdown
        lines.append("### Weighted Score Breakdown")
        lines.append("```")
        lines.append("Score = Σ (weight × P(action))")
        lines.append("")
        positive = {k: v for k, v in result.score_breakdown.items() if v > 0.01}
        negative = {k: v for k, v in result.score_breakdown.items() if v < -0.01}

        if positive:
            lines.append("Positive contributions:")
            for action, contrib in sorted(positive.items(), key=lambda x: -x[1]):
                lines.append(f"  {action}: +{contrib:.3f}")

        if negative:
            lines.append("Negative contributions:")
            for action, contrib in sorted(negative.items(), key=lambda x: x[1]):
                lines.append(f"  {action}: {contrib:.3f}")

        lines.append(f"\nTotal: {result.weighted_score:.3f}")
        lines.append("```")
        lines.append("")

        # Component scores
        lines.append("### Component Scores")
        lines.append(f"- Reply Potential: {result.reply_potential}/100 (40% weight)")
        lines.append(f"- Shareability: {result.shareability}/100 (25% weight)")
        lines.append(f"- Media Optimization: {result.media_optimization}/100 (15% weight)")
        lines.append(f"- Negative Signal Safety: {result.negative_signal_safety}/100 (20% weight)")
        lines.append("")

        # Probability estimates
        lines.append("### Estimated Probabilities")
        p = result.probabilities
        lines.append(f"- P(reply): {p.p_reply:.1%} → contributes +{result.score_breakdown['reply']:.3f}")
        lines.append(f"- P(repost): {p.p_repost:.1%} → contributes +{result.score_breakdown['repost']:.3f}")
        lines.append(f"- P(like): {p.p_like:.1%} → contributes +{result.score_breakdown['like']:.3f}")
        if p.p_video_view > 0:
            lines.append(f"- P(video_view): {p.p_video_view:.1%} → contributes +{result.score_breakdown['video_view']:.3f}")
        if p.p_photo_expand > 0:
            lines.append(f"- P(photo_expand): {p.p_photo_expand:.1%} → contributes +{result.score_breakdown['photo_expand']:.3f}")
        lines.append(f"- P(block): {p.p_block:.2%} → contributes {result.score_breakdown['block']:.3f}")
        lines.append("")

        # Metadata
        lines.append("### Post Metadata")
        lines.append(f"- Characters: {result.char_count}")
        lines.append(f"- Words: {result.word_count}")
        lines.append(f"- Has question: {'Yes' if result.has_question else 'No'}")
        lines.append(f"- Has media: {'Yes' if result.has_media else 'No'}{f' ({result.media_type})' if result.media_type else ''}")
        lines.append("")

    # Feedback
    if result.strengths:
        lines.append("### ✅ Strengths")
        for s in result.strengths:
            lines.append(f"- {s}")
        lines.append("")

    if result.weaknesses:
        lines.append("### ❌ Weaknesses")
        for w in result.weaknesses:
            lines.append(f"- {w}")
        lines.append("")

    if result.suggestions:
        lines.append("### 💡 Suggestions")
        for s in result.suggestions:
            lines.append(f"- {s}")

    return "\n".join(lines)


def quick_score(text: str, include_media: bool = False) -> float:
    """Get just the weighted score without full analysis."""
    result = analyze_post(text, include_media=include_media)
    return result.weighted_score


def compare_posts(posts: list[dict]) -> str:
    """
    Compare multiple posts and rank them.

    Args:
        posts: List of dicts with keys: text, include_media (optional), media_type (optional)

    Returns:
        Formatted comparison report
    """
    results = []
    for i, post in enumerate(posts):
        result = analyze_post(
            post.get("text", ""),
            include_media=post.get("include_media", False),
            media_type=post.get("media_type"),
        )
        results.append((i + 1, post.get("text", "")[:50], result))

    # Sort by weighted score
    results.sort(key=lambda x: x[2].weighted_score, reverse=True)

    lines = ["### Post Comparison (Ranked by Weighted Score)", ""]
    for rank, (num, preview, result) in enumerate(results, 1):
        emoji = "🥇" if rank == 1 else "🥈" if rank == 2 else "🥉" if rank == 3 else f"{rank}."
        lines.append(f"{emoji} Post {num}: **{result.weighted_score:.2f}** — \"{preview}...\"")
        lines.append(f"   Type: {result.post_type.value} | Reply: {result.reply_potential} | Safety: {result.negative_signal_safety}")

    return "\n".join(lines)


# === CLI / Example Usage ===

if __name__ == "__main__":
    examples = [
        {
            "text": "What's the one skill that 10x'd your career? I'll go first: learning to write clearly.",
            "include_media": False,
        },
        {
            "text": "Hot take: Remote work is dead.\n\nBut here's the nuance most people miss:\n\n1. Async-first remote work is thriving\n2. Sync-heavy remote work failed\n3. The problem was never remote, it was bad management\n\nAgree?",
            "include_media": True,
            "media_type": "image",
        },
        {
            "text": "Check out my new blog post: https://example.com/post",
            "include_media": False,
        },
        {
            "text": "Every founder eventually learns this the hard way:\n\n\"I wish I had started ___ sooner.\"",
            "include_media": False,
        },
        {
            "text": "I analyzed 10,000 X posts across 50 accounts.\n\n80% of impressions come from 20% of posts.\n\nStop optimizing everything. Double down on what's already working.",
            "include_media": True,
            "media_type": "image",
        },
    ]

    print("=" * 70)
    print("X ALGORITHM POST ANALYZER")
    print("=" * 70)

    for i, ex in enumerate(examples, 1):
        print(f"\n{'='*70}")
        print(f"EXAMPLE {i}")
        print(f"{'='*70}")
        print(f"Text: {ex['text'][:80]}{'...' if len(ex['text']) > 80 else ''}")
        print(f"Media: {ex.get('media_type', 'None')}")
        print("-" * 70)

        result = analyze_post(
            ex["text"],
            include_media=ex.get("include_media", False),
            media_type=ex.get("media_type"),
        )
        print(format_report(result))

    # Comparison
    print(f"\n{'='*70}")
    print("COMPARISON")
    print("=" * 70)
    print(compare_posts(examples))
