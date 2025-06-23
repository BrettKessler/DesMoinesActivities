# ChatGPT API Integration Improvement: Prompt & Parser Comparison

## Original Prompt

```
Generate a weekly, informational events newsletter for Des Moines and within 50 miles for the week of June 23, 2025–June 29, 2025.

Include:

• Every notable live-music show with date, time, venue, starting ticket price, ticket link, and 1-sentence artist bio.

• Major festivals, family or outdoor events with dates, hours, location, and admission info.

• Brief planning tips (parking, weather, family-friendly notes).

Format it in sections with tables or lists so it's ready to email.
```

## Improved Prompt

```
Generate a weekly, informational events newsletter for Des Moines and within 50 miles for the week of June 23, 2025–June 29, 2025.

Include:

• Notable live-music shows
• Major festivals, family or outdoor events
• Brief planning tips (parking, weather, family-friendly notes)

IMPORTANT: You MUST format your response EXACTLY as follows to ensure proper parsing:

### LIVE MUSIC

**[Event Name]**
* Date: [specific date in format: Day of week, Month Day]
* Time: [specific time]
* Venue: [specific venue name]
* Tickets: [price information]
* Ticket Link: [ticket link]
* Description: [brief artist bio or event description]

### FESTIVALS & EVENTS

**[Event Name]**
* Date: [specific date in format: Day of week, Month Day]
* Time: [specific time or hours]
* Venue: [specific venue or location]
* Admission: [price information]
* Website: [event website if available]
* Description: [brief event description]

### PLANNING TIPS

* **[Topic]**: [tip details]
* **[Topic]**: [tip details]
* **[Topic]**: [tip details]

Do not deviate from this format. Each event must include ALL the fields listed above, even if you need to indicate "Free" for tickets or "TBD" for unknown information. Do not add any additional sections or change the formatting.
```

## Key Differences in Prompts

1. **Explicit Formatting Instructions**: The improved prompt provides exact formatting requirements with clear section headers and field labels.

2. **Field Format Specification**: The improved prompt specifies the format for dates (Day of week, Month Day) and other fields.

3. **Default Value Guidance**: The improved prompt instructs to use "TBD" or other placeholders for unknown information rather than omitting fields.

4. **Strong Emphasis on Adherence**: The improved prompt uses capitalized "MUST" and includes a warning not to deviate from the format.

5. **Simplified Requirements**: The improved prompt simplifies the initial requirements to focus on the structure rather than the content details.

## Original Parser Issues

The original parser had several issues:

1. **Inconsistent Field Extraction**: Failed to reliably extract required fields (date, time, venue) from events.

2. **No Default Values**: Did not set default values for missing fields, leading to validation errors.

3. **Limited Pattern Matching**: Used limited regex patterns that couldn't handle variations in formatting.

4. **No Validation Layer**: Did not validate or filter events with missing required fields.

## Improved Parser Features

The improved parser addresses these issues:

1. **Robust Pattern Matching**: Uses multiple regex patterns for each field to handle various formatting styles.

2. **Default Values**: Sets default values (e.g., "TBD") for required fields when they can't be extracted.

3. **Validation Layer**: Filters out events with insufficient data (missing too many required fields).

4. **Better Section Handling**: Improved handling of different sections in the response.

5. **Fallback Strategies**: Implements fallback parsing strategies when the primary approach doesn't yield results.

## Sample Data Comparison

### Original Parser Results (from parser-improvement-test.txt)
- Found 80 total events (40 in each category)
- Many events had missing required fields
- Failed validation when saving to database

### Improved Parser Results (from sample-parsed-data.json)
- Found 10 total events (5 in each category)
- All events have complete required fields
- Successfully passes validation

## Conclusion

The combination of the improved prompt and parser creates a more robust system:

1. The improved prompt ensures ChatGPT returns data in a consistent, structured format.
2. The improved parser can reliably extract all required fields from the response.
3. The validation layer ensures only complete, high-quality data is saved to the database.

This approach significantly reduces the likelihood of validation errors and improves the overall reliability of the weekly activities update process.
