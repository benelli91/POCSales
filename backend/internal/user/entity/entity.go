package entity

import "time"

// User representa un usuario perteneciente a una organización.
type User struct {
	ID             int64     `json:"id"`
	OrganizationID int64     `json:"organization_id"`
	Email          string    `json:"email"`
	Name           string    `json:"name"`
	Role           string    `json:"role"`
	CreatedAt      time.Time `json:"created_at"`
}

// Organization es el tenant del sistema.
type Organization struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}
