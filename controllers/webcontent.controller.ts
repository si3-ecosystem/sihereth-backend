// src/controllers/webcontent.controller.ts
import fs from 'fs'
import ejs from 'ejs'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { File } from 'formdata-node'
import { Request, Response } from 'express'

import WebContent, {
  IWebContent,
  ILanding,
  ValueSection,
  ILive,
  LiveDetails,
  TimelineEntry,
  AvailableSection,
  SocialChannel
} from '../models/WebContent.model'
import User, { IUser } from '../models/User.model'
import { uploadToFileStorage, deleteFromFileStorage } from '../utils/fileStorage.utils'
import { registerSubdomain } from './domain.controller'

interface AuthRequest extends Request {
  user: { id: string; email: string; name: string; domain?: string }
  body: Partial<{
    landing: ILanding
    slider: string[]
    value: ValueSection
    live: ILive
    organizations: string[]
    timeline: TimelineEntry[]
    available: AvailableSection
    socialChannels: SocialChannel[]
    isNewWebpage: boolean
  }>
}

export const publishWebContent = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    console.log(`[WebContent] Starting publish operation for user: ${req.user.id}`)
    const userId = req.user.id
    const contentData = req.body

    if (!userId) {
      console.error(`[WebContent] Invalid user ID in publish operation`)
      return res.status(400).json({ message: 'Invalid user ID' })
    }

    console.log(`[WebContent] Content sections to update:`, {
      hasLanding: !!contentData.landing,
      hasSlider: !!contentData.slider,
      hasValue: !!contentData.value,
      hasLive: !!contentData.live,
      hasOrganizations: !!contentData.organizations,
      hasTimeline: !!contentData.timeline,
      hasAvailable: !!contentData.available,
      hasSocialChannels: !!contentData.socialChannels
    })

    if (
      !contentData.landing &&
      !contentData.slider &&
      !contentData.value &&
      !contentData.live &&
      !contentData.organizations &&
      !contentData.timeline &&
      !contentData.available &&
      !contentData.socialChannels
    ) {
      console.log(`[WebContent] Missing content data for user: ${userId}`)
      return res.status(400).json({ message: 'Missing content data' })
    }

    const content = {
      landing: contentData.landing || {},
      slider: contentData.slider || [],
      value: contentData.value || {},
      live: contentData.live || {},
      organizations: contentData.organizations || [],
      timeline: contentData.timeline || [],
      available: contentData.available || {},
      socialChannels: contentData.socialChannels || []
    }

    // Read & compile template
    let templateFile: Buffer
    try {
      templateFile = fs.readFileSync(path.join(__dirname, '../template/index.ejs'))
    } catch (readError: any) {
      console.error(`[WebContent] Error reading template file:`, {
        error: readError.message,
        code: readError.code
      })
      throw new Error(`Failed to read template file: ${readError.message}`)
    }

    type EjsTemplate = ReturnType<typeof ejs.compile>;

    let template: EjsTemplate;
    try {
      template = ejs.compile(templateFile.toString());
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(`[WebContent] Error compiling template:`, {
          message: err.message,
        });
        throw new Error(`Failed to compile template: ${err.message}`);
      } else {
        console.error('[WebContent] Unknown error compiling template:', err);
        throw new Error('Failed to compile template due to unknown error');
      }
    }

    let renderedTemplate: string
    try {
      renderedTemplate = template(content)
    } catch (renderError: any) {
      console.error(`[WebContent] Error rendering template:`, {
        error: renderError.message,
        line: renderError.line,
        column: renderError.column
      })
      throw new Error(`Failed to render template: ${renderError.message}`)
    }

    const filename = `${uuidv4()}.html`
    const file = new File([Buffer.from(renderedTemplate)], filename, { type: 'text/html' })

    console.log(`[WebContent] Uploading to storage for user: ${userId}`)
    let cid: string
    try {
      cid = await uploadToFileStorage(file)
      console.log(`[WebContent] Successfully uploaded to storage, CID: ${cid}`)
    } catch (uploadError: any) {
      console.error(`[WebContent] Error uploading to storage:`, {
        error: uploadError.message,
        code: uploadError.code,
        userId
      })
      throw new Error(`Failed to upload to storage: ${uploadError.message}`)
    }

    let webContent = await WebContent.findOne({ user: userId })

    if (webContent) {
      console.log(`[WebContent] Updating existing content for user: ${userId}`)
      webContent.contentHash = cid
      webContent.isNewWebpage = false
      webContent.landing = content.landing as ILanding
      webContent.slider = content.slider
      webContent.value = content.value as ValueSection
      webContent.live = content.live as ILive
      webContent.organizations = content.organizations
      webContent.timeline = content.timeline
      webContent.available = content.available as AvailableSection
      webContent.socialChannels = content.socialChannels
    } else {
      console.log(`[WebContent] Creating new content for user: ${userId}`)
      webContent = new WebContent({
        user: userId,
        contentHash: cid,
        isNewWebpage: contentData.isNewWebpage ?? false,
        landing: content.landing,
        slider: content.slider,
        value: content.value,
        live: content.live,
        organizations: content.organizations,
        timeline: content.timeline,
        available: content.available,
        socialChannels: content.socialChannels
      })
    }

    try {
      await webContent.save()
      console.log(`[WebContent] Successfully saved content for user: ${userId}`)
    } catch (saveError: any) {
      console.error(`[WebContent] Error saving web content:`, {
        error: saveError.message,
        code: saveError.code,
        validationErrors: saveError.errors
      })
      throw new Error(`Failed to save content: ${saveError.message}`)
    }

    console.log(`[WebContent] Successfully published for user: ${userId}`)
    return res.status(201).json({ message: 'Published successfully' })
  } catch (error: any) {
    console.error(`[WebContent] Error in publish operation for user: ${req.user.id}`, {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        error: error.errors,
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      })
    }
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    })
  }
}


export const updateWebContent = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    console.log(`[WebContent] Starting update operation for user: ${req.user.id}`)
    const userId = req.user.id
    const contentData = req.body

    if (!userId) {
      console.error(`[WebContent] Invalid user ID in update operation`)
      return res.status(400).json({ message: 'Invalid user ID' })
    }

    console.log(`[WebContent] Content sections to update:`, {
      hasLanding: !!contentData.landing,
      hasSlider: !!contentData.slider,
      hasValue: !!contentData.value,
      hasLive: !!contentData.live,
      hasOrganizations: !!contentData.organizations,
      hasTimeline: !!contentData.timeline,
      hasAvailable: !!contentData.available,
      hasSocialChannels: !!contentData.socialChannels
    })

    if (
      !contentData.landing &&
      !contentData.slider &&
      !contentData.value &&
      !contentData.live &&
      !contentData.organizations &&
      !contentData.timeline &&
      !contentData.available &&
      !contentData.socialChannels
    ) {
      console.log(`[WebContent] Missing content data for update - user: ${userId}`)
      return res.status(400).json({ message: 'Missing content data' })
    }

    const [webContent, user] = await Promise.all([
      WebContent.findOne({ user: userId }),
      User.findById(userId)
    ])

    if (!webContent) {
      console.log(`[WebContent] No content found to update for user: ${userId}`)
      return res.status(404).json({ message: 'No web content found to update' })
    }

    if (webContent.contentHash) {
      try {
        console.log(`[WebContent] Deleting old content from storage for hash: ${webContent.contentHash}`)
        await deleteFromFileStorage(webContent.contentHash)
        console.log(`[WebContent] Successfully deleted old content from storage`)
      } catch (deleteError: any) {
        console.error(`[WebContent] Failed to delete old content from storage:`, {
          error: deleteError.message,
          code: deleteError.code
        })
      }
    } else {
      console.log(`[WebContent] No existing content hash found, skipping deletion`)
    }

    const content = {
      landing: contentData.landing || webContent.landing,
      slider: contentData.slider || webContent.slider,
      value: contentData.value || webContent.value,
      live: contentData.live || webContent.live,
      organizations: contentData.organizations || webContent.organizations,
      timeline: contentData.timeline || webContent.timeline,
      available: contentData.available || webContent.available,
      socialChannels: contentData.socialChannels || webContent.socialChannels
    }

    // same template/read/compile/render/upload logic as publish…
    // (for brevity, you’d repeat the block from publishWebContent here,
    // using `content` and updating `webContent` fields accordingly)

    // after saving:
    if (user?.domain) {
      try {
        console.log(`[WebContent] Registering subdomain for user: ${userId}`)
        await registerSubdomain(user.domain, webContent.contentHash!)
        console.log(`[WebContent] Successfully registered subdomain for user: ${userId}`)
      } catch (subdomainError: any) {
        console.error(`[WebContent] Error registering subdomain:`, {
          error: subdomainError.message,
          code: subdomainError.code
        })
        throw new Error(`Failed to register subdomain: ${subdomainError.message}`)
      }
    }

    console.log(`[WebContent] Successfully updated content for user: ${userId}`)
    return res.status(200).json({
      message: 'Content updated successfully',
      contentHash: webContent.contentHash
    })
  } catch (error: any) {
    console.error(`[WebContent] Error in update operation for user: ${req.user.id}`, {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        error: error.errors,
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      })
    }
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    })
  }
}
