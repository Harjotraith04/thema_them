from typing import List
from pydantic import BaseModel, Field

# Endpoint schemas for AI services


class InitialCodingRequest(BaseModel):
    document_ids: List[int]


class ThemeGenerationRequest(BaseModel):
    codebook_id: int


class DeductiveCodingRequest(BaseModel):
    document_ids: List[int]
    codebook_id: int


# LLM output schemas

class CodeOutput(BaseModel):
    """
    Represents the output of a code creation.
    """
    reasoning: str = Field(
        description="The reasoning behind the code selection or creation.")
    code: str = Field(description="The assigned/generated code name.")
    quote: str = Field(
        description="Exact quote from the passage that the code is attached to.")
    code_description: str = Field(
        description="Description of the code, explaining how it relates to the quote.")
    is_new_code: bool = Field(
        description="True if this is a new code, False if using an existing code.")
    existing_code_rationale: str = Field(
        default="", description="If using an existing code, explain why it fits this text segment.")
    confidence: int = Field(
        description="Confidence score from 0-100 indicating how certain you are about this code assignment.",
        ge=0, le=100)


class MultipleCodesOutput(BaseModel):
    """
    Represents multiple code outputs from a single text chunk.
    """
    codes: List[CodeOutput] = Field(
        description="List of codes identified in the text chunk. Should include all significant concepts, themes, or patterns found.")
    analysis_notes: str = Field(
        default="", description="Optional notes about the overall analysis of this text chunk.")


class ThemeOutput(BaseModel):
    """
    Represents the output of theme generation from codes.
    """
    reasoning: str = Field(
        description="The reasoning behind the theme generation.")
    theme_name: str = Field(description="The name of the generated theme.")
    theme_description: str = Field(
        description="Detailed description of the theme.")
    related_codes: List[str] = Field(
        description="List of code names that relate to this theme.")


class DeductiveCodingOutput(BaseModel):
    """
    Represents the output of deductive coding using existing codes.
    """
    reasoning: str = Field(
        description="The reasoning behind the code assignment.")
    assigned_codes: List[str] = Field(
        description="List of code names assigned to this text segment.")
    quote: str = Field(
        description="Exact quote from the passage that the codes are attached to.")
    confidence_scores: List[float] = Field(
        description="Confidence scores (0-1) for each assigned code.")
    rationale: str = Field(
        description="Explanation of why these specific codes were selected for this text.")


class CodeRefinementOutput(BaseModel):
    """
    Represents the output of code refinement after reviewing all assignments.
    """
    action: str = Field(
        description="Action to take: 'keep', 'modify', or 'delete'")
    reasoning: str = Field(
        description="The reasoning behind the refinement decision.")
    refined_code_name: str = Field(
        default="", description="The refined code name (if action is 'modify')")
    refined_code_description: str = Field(
        default="", description="The refined code description (if action is 'modify')")
    confidence: float = Field(
        description="Confidence score (0-1) for the refinement decision.")


class CodeGroup(BaseModel):
    """
    Represents a group of related codes.
    """
    group_name: str = Field(
        description="Name of the code group (like a sub-theme)")
    group_description: str = Field(
        description="Description of what this group represents")
    code_names: List[str] = Field(
        description="List of code names that belong to this group")
    rationale: str = Field(
        description="Explanation of why these codes are grouped together")


class CodeGroupingOutput(BaseModel):
    """
    Represents the output of code grouping analysis.
    """
    reasoning: str = Field(
        description="Overall reasoning for the grouping strategy")
    groups: List[CodeGroup] = Field(
        description="List of code groups identified")
    ungrouped_codes: List[str] = Field(
        default=[], description="Codes that don't fit into any group")
