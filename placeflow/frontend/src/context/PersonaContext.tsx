import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserPersona = 'STUDENT' | 'FACULTY' | 'HOD_DEAN' | 'TPO_PLACEMENT' | 'MANAGEMENT';

export interface PersonaConfig {
  id: UserPersona;
  title: string;
  badgeLabel: string;
  roleDescription: string;
  avatarInitials: string;
}

export const PERSONA_CONFIGS: Record<UserPersona, PersonaConfig> = {
  STUDENT: {
    id: 'STUDENT',
    title: 'Student Workspace',
    badgeLabel: 'Student',
    roleDescription: 'B.Tech CSE • Semester 6',
    avatarInitials: 'ST',
  },
  FACULTY: {
    id: 'FACULTY',
    title: 'Faculty Workspace',
    badgeLabel: 'Faculty',
    roleDescription: 'Senior Assistant Professor • CSE',
    avatarInitials: 'FA',
  },
  HOD_DEAN: {
    id: 'HOD_DEAN',
    title: 'HOD / Dean Workspace',
    badgeLabel: 'HOD / Dean',
    roleDescription: 'Head of Department • Computing',
    avatarInitials: 'HD',
  },
  TPO_PLACEMENT: {
    id: 'TPO_PLACEMENT',
    title: 'TPO Placement Workspace',
    badgeLabel: 'Placement Officer',
    roleDescription: 'Directorate of Career Services',
    avatarInitials: 'TP',
  },
  MANAGEMENT: {
    id: 'MANAGEMENT',
    title: 'Executive Management',
    badgeLabel: 'Leadership',
    roleDescription: 'Office of the Vice Chancellor / Registrar',
    avatarInitials: 'VC',
  },
};

interface PersonaContextType {
  activePersona: UserPersona;
  personaConfig: PersonaConfig;
  switchPersona: (persona: UserPersona) => void;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export const PersonaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePersona, setActivePersona] = useState<UserPersona>(() => {
    const saved = localStorage.getItem('placeflow_persona') as UserPersona;
    return saved && PERSONA_CONFIGS[saved] ? saved : 'TPO_PLACEMENT';
  });

  const switchPersona = (persona: UserPersona) => {
    setActivePersona(persona);
    localStorage.setItem('placeflow_persona', persona);
  };

  const personaConfig = PERSONA_CONFIGS[activePersona];

  return (
    <PersonaContext.Provider value={{ activePersona, personaConfig, switchPersona }}>
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersona = () => {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
};

