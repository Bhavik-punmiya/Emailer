const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface Contact {
  id?: string
  name: string
  email: string
  company?: string
  job_title?: string
}

export interface EmailTemplate {
  id?: string
  name: string
  subject: string
  body: string
}

export interface FileAttachment {
  filename: string
  content: string  // base64 encoded content
  content_type: string
}

export interface SavedTemplate {
  id?: string
  user_id: string
  name: string
  subject: string
  body: string
  attachments?: FileAttachment[]
  created_at?: string
  updated_at?: string
}

export interface DashboardStats {
  total_campaigns: number
  total_emails_sent: number
  total_emails_failed: number
  recent_campaigns: any[]
  templates_count: number
  has_email_settings: boolean
}

export interface Campaign {
  id: string
  user_id: string
  name: string
  subject: string
  body: string
  status: string
  total_emails: number
  sent_count: number
  failed_count: number
  progress: number
  created_at: string
  updated_at: string
}

export interface SendEmailRequest {
  contacts: Contact[]
  template: EmailTemplate
  user_id: string
  attachments?: FileAttachment[]
}

export interface CampaignStatus {
  campaign_id: string
  status: string
  sent: number
  failed: number
  total: number
  progress: number
}

export interface EmailSettings {
  id: string
  user_id: string
  email_host: string
  email_port: number
  email_user: string
  email_display_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Add auth token if available
    if (typeof window !== 'undefined') {
      try {
        const { createBrowserSupabaseClient } = await import('@/lib/supabase')
        const supabase = createBrowserSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.access_token) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${session.access_token}`,
          }
        } else {
          console.warn('No session found - user might not be authenticated')
        }
      } catch (e) {
        console.warn('Failed to get auth token:', e)
      }
    }

    console.log(`Making request to: ${url}`)
    console.log('Request config:', config)

    const response = await fetch(url, config)
    
    console.log(`Response status: ${response.status}`)
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.detail || errorMessage
      } catch (e) {
        console.warn('Could not parse error response:', e)
      }
      throw new Error(errorMessage)
    }

    return response.json()
  }

  // Test authentication
  async testAuth(): Promise<{ message: string; user_id: string }> {
    return this.request('/api/test-auth')
  }

  // Email sending
  async sendEmails(request: SendEmailRequest): Promise<{ campaign_id: string; status: string; message: string }> {
    return this.request('/api/send-emails', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async getCampaignStatus(campaignId: string): Promise<CampaignStatus> {
    return this.request(`/api/campaigns/${campaignId}/status`)
  }

  // Template management
  async getTemplates(): Promise<{ templates: SavedTemplate[] }> {
    return this.request('/api/templates')
  }

  async createTemplate(template: Omit<SavedTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<{ template: SavedTemplate }> {
    return this.request('/api/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    })
  }

  async updateTemplate(templateId: string, template: Omit<SavedTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<{ template: SavedTemplate }> {
    return this.request(`/api/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    })
  }

  async deleteTemplate(templateId: string): Promise<{ message: string }> {
    return this.request(`/api/templates/${templateId}`, {
      method: 'DELETE',
    })
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request('/api/dashboard/stats')
  }

  async getCampaigns(): Promise<{ campaigns: Campaign[] }> {
    return this.request('/api/campaigns')
  }

  // Email Settings
  async getEmailSettings(): Promise<EmailSettings> {
    return this.request('/api/email-settings')
  }

  async saveEmailSettings(settings: {
    email_host: string
    email_port: number
    email_user: string
    email_password: string
    email_display_name: string
  }): Promise<EmailSettings> {
    return this.request('/api/email-settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    })
  }

  async testEmailSettings(settings: {
    email_host: string
    email_port: number
    email_user: string
    email_password: string
    email_display_name: string
  }): Promise<{ message: string }> {
    return this.request('/api/email-settings/test', {
      method: 'POST',
      body: JSON.stringify(settings),
    })
  }
}

export const apiService = new ApiService() 