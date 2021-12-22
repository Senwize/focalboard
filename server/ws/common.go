package ws

import (
	"github.com/mattermost/focalboard/server/model"
)

// UpdateMsg is sent on block updates.
type UpdateMsg struct {
	Action          string                            `json:"action"`
	Block           *model.Block                      `json:"block,omitempty"`
	Category        *model.Category                   `json:"category,omitempty"`
	BlockCategories *model.BlockCategoryWebsocketData `json:"blockCategories,omitempty"`
}

// WebsocketCommand is an incoming command from the client.
type WebsocketCommand struct {
	Action      string   `json:"action"`
	WorkspaceID string   `json:"workspaceId"`
	Token       string   `json:"token"`
	ReadToken   string   `json:"readToken"`
	BlockIDs    []string `json:"blockIds"`
}