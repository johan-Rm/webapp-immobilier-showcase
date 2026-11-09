type DashboardEditorPanelContent = {
  reset: string
  blockActions: string
  addQuality: string
  sections: Record<string, string>
  blocks: Record<string, string>
}

type DashboardEditorPanelMedia = {
  blocks: Record<string, string>
}

type DashboardEditorPanel = {
  close: string
  editTitle: string
  editionNote: string
  propertyActions: string
  content: DashboardEditorPanelContent
  media: DashboardEditorPanelMedia
}

export type DashboardContent = {
  sidebar: Record<string, string>
  editor: {
    panel: DashboardEditorPanel
  }
}
