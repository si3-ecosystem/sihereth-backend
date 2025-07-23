// src/models/WebContent.model.ts
import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface ILanding {
  fullName: string
  title?: string
  headline?: string
  hashTags?: string[]
  region?: string
  organizationAffiliations?: string[]
  communityAffiliations?: string[]
  superPowers?: string[]
  image?: string
  pronoun?: string
}

export interface ValueSection {
  experience?: string
  values?: string
}

export interface LiveDetails {
  title?: string
  heading?: string
  body?: string
}

export interface ILive {
  image?: string
  video?: string
  url?: string
  walletUrl?: string
  details?: LiveDetails[]
}

export interface TimelineEntry {
  title?: string
  to?: string
  from?: string
}

export interface AvailableSection {
  avatar?: string
  availableFor?: string[]
  ctaUrl?: string
  ctaText?: string
}

export interface SocialChannel {
  text?: string
  url?: string
  icon?: string
}

export interface IWebContent extends Document {
  user: Types.ObjectId
  contentHash?: string
  landing: ILanding
  slider: string[]
  value: ValueSection
  live: ILive
  organizations: string[]
  timeline: TimelineEntry[]
  available: AvailableSection
  socialChannels: SocialChannel[]
  isNewWebpage: boolean
  createdAt: Date
  updatedAt: Date
}

const LandingSchema = new Schema<ILanding>({
  fullName:                String,
  title:                   String,
  headline:                String,
  hashTags:                [String],
  region:                  String,
  organizationAffiliations: [String],
  communityAffiliations:   [String],
  superPowers:             [String],
  image:                   String,
  pronoun:                 String
}, { _id: false })

const ValueSchema = new Schema<ValueSection>({
  experience: String,
  values:     String
}, { _id: false })

const LiveDetailsSchema = new Schema<LiveDetails>({
  title:   String,
  heading: String,
  body:    String
}, { _id: false })

const LiveSchema = new Schema<ILive>({
  image:     String,
  video:     String,
  url:       String,
  walletUrl: String,
  details:   [LiveDetailsSchema]
}, { _id: false })

const TimelineSchema = new Schema<TimelineEntry>({
  title: String,
  to:    String,
  from:  String
}, { _id: false })

const AvailableSchema = new Schema<AvailableSection>({
  avatar:       String,
  availableFor: [String],
  ctaUrl:       String,
  ctaText:      String
}, { _id: false })

const SocialChannelSchema = new Schema<SocialChannel>({
  text: String,
  url:  String,
  icon: String
}, { _id: false })

const webContentSchema: Schema<IWebContent> = new Schema(
  {
    user:           { type: Schema.Types.ObjectId, ref: 'User', required: true },
    contentHash:    { type: String },
    landing:        { type: LandingSchema, default: {} },
    slider:         { type: [String], default: [] },
    value:          { type: ValueSchema, default: {} },
    live:           { type: LiveSchema, default: {} },
    organizations:  { type: [String], default: [] },
    timeline:       { type: [TimelineSchema], default: [] },
    available:      { type: AvailableSchema, default: {} },
    socialChannels: { type: [SocialChannelSchema], default: [] },
    isNewWebpage:   { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'web_contents'
  }
)

const WebContent: Model<IWebContent> = mongoose.model<IWebContent>('WebContent', webContentSchema)
export default WebContent
