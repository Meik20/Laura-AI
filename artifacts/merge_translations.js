const fs = require('fs');
const path = require('path');

const frPath = path.join(__dirname, '..', 'client', 'src', 'locales', 'fr', 'translation.json');
const enPath = path.join(__dirname, '..', 'client', 'src', 'locales', 'en', 'translation.json');

const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// 1. Root level contribution_modal
const contribution_modal_fr = {
  "title": "Proposer une ressource",
  "subtitle": "Partagez un document pédagogique avec la communauté.",
  "success_title": "Merci pour votre contribution !",
  "success_desc": "Votre document a été soumis pour relecture. Il sera publié dans le catalogue après validation par un modérateur.",
  "success_btn": "Fermer",
  "errors": {
    "file_size": "Le fichier dépasse la taille maximale autorisée (30 Mo).",
    "title_required": "Veuillez renseigner un titre.",
    "file_required": "Veuillez sélectionner un fichier à soumettre.",
    "login_required": "Vous devez être connecté pour contribuer.",
    "general": "Une erreur est survenue lors de la soumission de votre document."
  },
  "form": {
    "title_label": "Titre du document",
    "title_placeholder": "Ex : Cours sur les limites de fonctions",
    "type_label": "Type de document",
    "subject_label": "Matière",
    "subject_placeholder": "Sélectionnez ou saisissez la matière",
    "exam_label": "Examen concerné",
    "exam_options": {
      "all": "Tous les examens"
    },
    "level_label": "Classe / Niveau",
    "level_placeholder": "Ex : Terminale D, Licence 2...",
    "desc_label": "Description / Instructions",
    "desc_placeholder": "Décrivez brièvement le contenu ou donnez des consignes d'utilisation...",
    "type_options": {
      "fiche": "Fiche",
      "annale": "Annale",
      "epreuve": "Épreuve",
      "quiz": "Quiz",
      "livre": "Livre"
    }
  },
  "upload": {
    "click_to_change": "cliquez pour changer de fichier",
    "click_to_select": "Cliquez pour sélectionner un fichier",
    "limits": "PDF, Office ou Images, max 30 MB"
  }
};

const contribution_modal_en = {
  "title": "Submit a resource",
  "subtitle": "Share an educational document with the community.",
  "success_title": "Thank you for your contribution!",
  "success_desc": "Your document has been submitted for review. It will be published in the catalog after validation by a moderator.",
  "success_btn": "Close",
  "errors": {
    "file_size": "The file exceeds the maximum allowed size (30 MB).",
    "title_required": "Please enter a title.",
    "file_required": "Please select a file to submit.",
    "login_required": "You must be logged in to contribute.",
    "general": "An error occurred while submitting your document."
  },
  "form": {
    "title_label": "Document Title",
    "title_placeholder": "e.g., Lesson on function limits",
    "type_label": "Document Type",
    "subject_label": "Subject",
    "subject_placeholder": "Select or enter the subject",
    "exam_label": "Target Exam",
    "exam_options": {
      "all": "All exams"
    },
    "level_label": "Class / Level",
    "level_placeholder": "e.g., Terminale D, Year 2...",
    "desc_label": "Description / Instructions",
    "desc_placeholder": "Briefly describe the content or provide usage instructions...",
    "type_options": {
      "fiche": "Sheet",
      "annale": "Past Exam",
      "epreuve": "Exam",
      "quiz": "Quiz",
      "livre": "Book"
    }
  },
  "upload": {
    "click_to_change": "click to change file",
    "click_to_select": "Click to select a file",
    "limits": "PDF, Office, or Images, max 30 MB"
  }
};

// 2. Root level community
const community_fr = {
  "welcome": {
    "title": "Rejoindre la communauté",
    "desc": "Échangez avec d'autres apprenants, partagez des ressources et progressez ensemble en rejoignant notre communauté active.",
    "join_btn": "Rejoindre la communauté"
  },
  "join_success": "Félicitations, tu viens de rejoindre la communauté. Intègre ta classe.",
  "chat": {
    "empty_title": "Bienvenue dans la classe !",
    "empty_desc": "Soyez le premier à envoyer un message.",
    "input_placeholder": "Écrivez un message..."
  },
  "status": {
    "pending_desc": "Votre demande d'accès à ce forum est en cours de validation par un administrateur.",
    "rejected_desc": "Votre accès à ce forum de classe a été refusé par l'équipe de modération.",
    "unjoined_desc": "Vous devez faire une demande pour rejoindre cette classe."
  },
  "placeholder": {
    "title": "Rejoignez votre classe",
    "desc": "Sélectionnez ou recherchez un forum de classe dans la liste à droite pour commencer à échanger avec les autres apprenants."
  },
  "sidebar": {
    "status_pending": "⏳ Attente",
    "status_rejected": "✕ Refusé",
    "status_join": "Demander à rejoindre",
    "status_open": "✓ Ouvert",
    "search_placeholder": "Rechercher un forum...",
    "search_format": "Format : Niveau série/filière (ex: Terminale A)",
    "create_btn": "+ Créer une classe",
    "empty": "Aucun forum de classe trouvé.",
    "participants": "participant",
    "participants_plural": "participants"
  },
  "modal": {
    "create_class_title": "Créer une classe",
    "level": "Niveau",
    "serie": "Série",
    "save": "Enregistrer"
  },
  "alerts": {
    "join_error": "Erreur lors de l'adhésion à la communauté.",
    "request_error": "Erreur lors de la demande d'accès.",
    "already_exists": "Une classe pour ce niveau/série existe déjà ! Demandez plutôt à la rejoindre.",
    "create_error": "Erreur lors de la création.",
    "send_error": "Erreur d'envoi."
  }
};

const community_en = {
  "welcome": {
    "title": "Join the Community",
    "desc": "Interact with other learners, share resources, and progress together by joining our active community.",
    "join_btn": "Join the Community"
  },
  "join_success": "Congratulations, you have joined the community! Access your class forum.",
  "chat": {
    "empty_title": "Welcome to the class!",
    "empty_desc": "Be the first to send a message.",
    "input_placeholder": "Write a message..."
  },
  "status": {
    "pending_desc": "Your access request for this forum is currently pending approval by an administrator.",
    "rejected_desc": "Your access request for this class forum has been declined by the moderation team.",
    "unjoined_desc": "You must submit a request to join this class."
  },
  "placeholder": {
    "title": "Join Your Class",
    "desc": "Select or search for a class forum from the list on the right to start interacting with other learners."
  },
  "sidebar": {
    "status_pending": "⏳ Pending",
    "status_rejected": "✕ Declined",
    "status_join": "Request to join",
    "status_open": "✓ Open",
    "search_placeholder": "Search a forum...",
    "search_format": "Format: Level stream/major (e.g., Grade 12 A)",
    "create_btn": "+ Create a class",
    "empty": "No class forum found.",
    "participants": "participant",
    "participants_plural": "participants"
  },
  "modal": {
    "create_class_title": "Create a class",
    "level": "Level",
    "serie": "Stream/Series",
    "save": "Save"
  },
  "alerts": {
    "join_error": "Error joining the community.",
    "request_error": "Error requesting access.",
    "already_exists": "A class for this level/stream already exists! Please request to join it instead.",
    "create_error": "Error creating class.",
    "send_error": "Error sending message."
  }
};

// 3. Tutor pages translations
const tutor_fr = {
  "chat": {
    "title": "Chat Pédagogique",
    "subtitle": "Utilisez l'IA pour générer et structurer vos contenus avant de les soumettre.",
    "new_chat": "🗑️ Nouveau Chat",
    "loading_session": "Chargement de la session...",
    "user_label": "Vous",
    "ai_label": "LAURA Pédagogie",
    "attach_file": "📎 Joindre un fichier / cours",
    "placeholder": "Ex: Génère un quiz de 5 questions sur le théorème de Thalès pour des élèves de 3ème...",
    "quick_suggestions": "Suggestions rapides",
    "export_title": "Export & Soumission",
    "export_desc": "Une fois votre contenu généré et affiné, vous pouvez l'exporter directement comme brouillon dans vos soumissions.",
    "export_btn": "Convertir en soumission",
    "welcome_message": "Bonjour Professeur {{name}}. Je suis configurée pour vous assister dans la création de matériel pédagogique en {{discipline}}. Que souhaitez-vous préparer aujourd'hui ?",
    "alert_no_content": "Aucun contenu généré par LAURA à convertir.",
    "alert_no_user": "Utilisateur non identifié.",
    "alert_export_success": "Contenu exporté avec succès dans vos soumissions (Brouillon) !",
    "alert_export_error": "Erreur lors de l'exportation.",
    "laura_error": "Désolée, je n'ai pas pu formuler une réponse.",
    "network_error": "⚠️ Oups ! Je n'arrive pas à joindre le serveur pour le moment. Vérifiez votre connexion internet ou réessayez dans quelques instants.",
    "suggestions": {
      "plan": "Générer un plan de cours",
      "exercise": "Créer une fiche d'exercices d'application",
      "exam": "Concevoir un sujet d'examen",
      "simplify": "Reformuler cette leçon de manière simple",
      "quiz": "Produire un quiz d'évaluation rapide"
    },
    "attached_doc": "📎 Document :",
    "doc_btn_design": "✨ Concevoir des exercices à partir de ce cours"
  },
  "submissions": {
    "restricted_title": "Espace Soumission Restreint",
    "restricted_desc": "Vous devez avoir le statut <strong>Tuteur Contributeur</strong> pour proposer du contenu sur la plateforme.",
    "request_access_btn": "Faire la demande d'accès",
    "request_access_success": "Demande transmise à l'administration.",
    "title": "Vos Soumissions",
    "subtitle": "Soumettez et gérez vos contenus pédagogiques.",
    "new_submission_btn": "+ Nouvelle soumission",
    "stats": {
      "total": "Total",
      "pending": "En attente",
      "validated": "Validés",
      "drafts": "Brouillons",
      "submissions_badge": "Soumissions",
      "pending_badge": "En cours",
      "validated_badge": "Publiés",
      "drafts_badge": "Brouillon"
    },
    "filters": {
      "all": "Toutes",
      "drafts": "Brouillons",
      "pending": "En attente",
      "to_correct": "À corriger",
      "validated": "Validées"
    },
    "table": {
      "title": "Titre",
      "type": "Type",
      "subject": "Matière",
      "level": "Niveau",
      "date": "Date",
      "status": "Statut",
      "actions": "Actions",
      "loading": "Chargement...",
      "empty": "Aucune soumission. Créer votre première soumission →",
      "view_btn": "Voir",
      "status_valide": "Validé ✓",
      "status_rejete": "Rejeté",
      "status_brouillon": "Brouillon",
      "untitled": "Sans titre"
    },
    "modal_new": {
      "title": "Nouvelle Contribution",
      "edit_title": "Modifier la Soumission",
      "form_title": "Titre du document",
      "form_type": "Type de document",
      "form_subject": "Matière",
      "form_level": "Classe / Niveau cible",
      "form_desc": "Description / Objectifs",
      "form_content": "Contenu (Optionnel si fichier joint)",
      "file_label": "Fichier joint (PDF, Word, Images, max 30 Mo)",
      "save_draft": "Enregistrer en brouillon",
      "submit_for_review": "Soumettre pour relecture",
      "saving": "Enregistrement...",
      "success_created": "Soumission créée avec succès !",
      "success_updated": "Soumission mise à jour avec succès !",
      "error_required": "Le titre, la matière et le niveau cible sont obligatoires.",
      "error_general": "Une erreur est survenue lors de l'enregistrement de la ressource."
    },
    "modal_detail": {
      "title": "Détails de la ressource",
      "info": "Informations générales",
      "author": "Auteur",
      "created_at": "Créée le",
      "updated_at": "Modifiée le",
      "content_tab": "Contenu",
      "file_tab": "Fichier joint",
      "status": "Statut",
      "close": "Fermer",
      "no_content": "Aucun contenu textuel pour cette ressource.",
      "open_file": "Ouvrir le fichier joint",
      "not_provided": "Non fourni"
    }
  },
  "history": {
    "title": "Historique Pédagogique",
    "subtitle": "Retrouvez vos anciennes conversations avec l'IA et vos soumissions de ressources.",
    "loading": "Chargement de l'historique...",
    "empty": "Aucun historique disponible",
    "empty_hint": "Démarrez un chat ou une soumission !",
    "chat_label": "Chat Pédagogique",
    "submission_label": "Soumission",
    "btn_manage": "Gérer",
    "btn_resume": "Reprendre",
    "waiting_reply": "En attente de réponse...",
    "preview_submission": "Type : {{type}} · Statut : {{status}}"
  },
  "profile": {
    "title": "Profil Tuteur",
    "subtitle": "Gérez vos informations professionnelles et académiques.",
    "success": "Profil tuteur mis à jour avec succès !",
    "error": "Erreur lors de la mise à jour.",
    "firstname": "Prénom *",
    "lastname": "Nom *",
    "email": "Adresse Email",
    "email_disabled": "L'adresse email ne peut pas être modifiée.",
    "academic_info": "Informations Pédagogiques",
    "discipline": "Discipline d'enseignement *",
    "discipline_placeholder": "ex: Mathématiques",
    "etablissement": "Établissement / Structure",
    "etablissement_placeholder": "ex: Lycée Leclerc",
    "experience": "Années d'expérience",
    "experience_placeholder": "ex: 5",
    "diplome": "Diplôme principal",
    "diplome_placeholder": "ex: CAPES, Master",
    "saving": "Enregistrement...",
    "save_btn": "Enregistrer les modifications"
  },
  "settings": {
    "title": "Paramètres Tuteur",
    "subtitle": "Personnalisez votre espace pédagogique et vos préférences de notification.",
    "success": "Paramètres tuteur enregistrés avec succès !",
    "error": "Erreur lors de la mise à jour.",
    "notif_title": "Notifications de révision",
    "notif_desc": "Recevoir un email lorsque l'administration commente ou valide vos soumissions.",
    "theme_title": "Thème de l'interface",
    "theme_placeholder": "Thème Clair (Par défaut)",
    "theme_clair": "Thème Clair (Par défaut)",
    "theme_sombre": "Thème Sombre",
    "rythme_title": "Rythme de soumission souhaité",
    "rythme_placeholder": "Hebdomadaire (1 ressource par semaine)",
    "rythme_occasionnel": "Occasionnel (1-2 ressources par mois)",
    "rythme_hebdomadaire": "Hebdomadaire (1 ressource par semaine)",
    "rythme_intensif": "Intensif (Plusieurs ressources par semaine)",
    "saving": "Enregistrement...",
    "save_btn": "Enregistrer les préférences"
  },
  "status": {
    "title": "Suivi de candidature",
    "loading": "Chargement du statut...",
    "no_application": "Aucune candidature trouvée",
    "no_application_desc": "Vous n'avez pas encore soumis de dossier de candidature pour devenir tuteur.",
    "apply_btn": "Postuler maintenant",
    "label_candidate": "Candidat",
    "label_discipline": "Discipline",
    "label_date": "Date de soumission",
    "label_status": "Statut actuel",
    "status_recu": "Reçu",
    "status_en_examen": "En examen",
    "status_test_requis": "Test requis",
    "status_valide": "Validé",
    "status_active": "Compte Activé",
    "status_refuse": "Refusé",
    "status_pending": "En attente",
    "admin_message_title": "Message de l'administration :",
    "admin_message_default": "Votre dossier est actuellement en cours d'analyse par notre équipe pédagogique.",
    "start_test_btn": "Commencer le test d'évaluation",
    "access_space_btn": "Accéder à mon espace",
    "back_home_btn": "Retour à l'accueil"
  },
  "resources": {
    "title": "Ressources Pédagogiques",
    "subtitle": "Consultez le catalogue partagé par les tuteurs et contributeurs de LAURA.",
    "search_placeholder": "Rechercher par titre, matière...",
    "filter_placeholder": "Filtrer par type...",
    "all_types": "Tous les types",
    "loading": "Chargement des ressources...",
    "empty": "Aucune ressource trouvée",
    "status_online": "✓ En Ligne",
    "status_draft": "• Brouillon",
    "label_subject": "Matière :",
    "label_target": "Cible :",
    "open_btn": "Ouvrir la ressource",
    "untitled": "Sans titre",
    "general": "Général"
  }
};

const tutor_en = {
  "chat": {
    "title": "Pedagogical Chat",
    "subtitle": "Use AI to generate and structure your contents before submitting them.",
    "new_chat": "New Chat",
    "loading_session": "Loading session...",
    "user_label": "You",
    "ai_label": "LAURA Pedagogy",
    "attach_file": "Attach a file / course",
    "placeholder": "e.g., Generate a 5-question quiz on Thales theorem for Grade 9 students...",
    "quick_suggestions": "Quick Suggestions",
    "export_title": "Export & Submission",
    "export_desc": "Once your content is generated and refined, you can export it directly as a draft in your submissions.",
    "export_btn": "Convert to submission",
    "welcome_message": "Hello Professor {{name}}. I am configured to assist you in creating educational material in {{discipline}}. What would you like to prepare today?",
    "alert_no_content": "No content generated by LAURA to convert.",
    "alert_no_user": "Unidentified user.",
    "alert_export_success": "Content successfully exported to your submissions (Draft)!",
    "alert_export_error": "Error during export.",
    "laura_error": "Sorry, I could not formulate a response.",
    "network_error": "⚠️ Oops! I can't reach the server right now. Please check your internet connection or try again in a few moments.",
    "suggestions": {
      "plan": "Generate a lesson plan",
      "exercise": "Create an application exercise sheet",
      "exam": "Design an exam subject",
      "simplify": "Reformulate this lesson in a simple way",
      "quiz": "Produce a quick evaluation quiz"
    },
    "attached_doc": "📎 Document:",
    "doc_btn_design": "✨ Design exercises from this course"
  },
  "submissions": {
    "restricted_title": "Restricted Submission Area",
    "restricted_desc": "You must have <strong>Tutor Contributor</strong> status to submit content on the platform.",
    "request_access_btn": "Request access rights",
    "request_access_success": "Request transmitted to the administration.",
    "title": "Your Submissions",
    "subtitle": "Submit and manage your educational content.",
    "new_submission_btn": "+ New submission",
    "stats": {
      "total": "Total",
      "pending": "Pending",
      "validated": "Validated",
      "drafts": "Drafts",
      "submissions_badge": "Submissions",
      "pending_badge": "In progress",
      "validated_badge": "Published",
      "drafts_badge": "Draft"
    },
    "filters": {
      "all": "All",
      "drafts": "Drafts",
      "pending": "Pending",
      "to_correct": "To correct",
      "validated": "Validated"
    },
    "table": {
      "title": "Title",
      "type": "Type",
      "subject": "Subject",
      "level": "Level",
      "date": "Date",
      "status": "Status",
      "actions": "Actions",
      "loading": "Loading...",
      "empty": "No submissions. Create your first submission →",
      "view_btn": "View",
      "status_valide": "Validated ✓",
      "status_rejete": "Declined",
      "status_brouillon": "Draft",
      "untitled": "Untitled"
    },
    "modal_new": {
      "title": "New Contribution",
      "edit_title": "Edit Submission",
      "form_title": "Document Title",
      "form_type": "Document Type",
      "form_subject": "Subject",
      "form_level": "Target Class / Level",
      "form_desc": "Description / Objectives",
      "form_content": "Content (Optional if file attached)",
      "file_label": "Attached file (PDF, Word, Images, max 30 MB)",
      "save_draft": "Save as draft",
      "submit_for_review": "Submit for review",
      "saving": "Saving...",
      "success_created": "Submission created successfully!",
      "success_updated": "Submission updated successfully!",
      "error_required": "Title, subject, and target level are required.",
      "error_general": "An error occurred while saving the resource."
    },
    "modal_detail": {
      "title": "Resource Details",
      "info": "General Information",
      "author": "Author",
      "created_at": "Created at",
      "updated_at": "Modified at",
      "content_tab": "Content",
      "file_tab": "Attached file",
      "status": "Status",
      "close": "Close",
      "no_content": "No text content for this resource.",
      "open_file": "Open attached file",
      "not_provided": "Not provided"
    }
  },
  "history": {
    "title": "Pedagogical History",
    "subtitle": "Find your previous conversations with AI and your resource submissions.",
    "loading": "Loading history...",
    "empty": "No history available",
    "empty_hint": "Start a chat or a submission!",
    "chat_label": "Pedagogical Chat",
    "submission_label": "Submission",
    "btn_manage": "Manage",
    "btn_resume": "Resume",
    "waiting_reply": "Waiting for reply...",
    "preview_submission": "Type: {{type}} · Status: {{status}}"
  },
  "profile": {
    "title": "Tutor Profile",
    "subtitle": "Manage your professional and academic information.",
    "success": "Tutor profile updated successfully!",
    "error": "Error during update.",
    "firstname": "First name *",
    "lastname": "Last name *",
    "email": "Email Address",
    "email_disabled": "The email address cannot be modified.",
    "academic_info": "Pedagogical Information",
    "discipline": "Teaching discipline *",
    "discipline_placeholder": "e.g., Mathematics",
    "etablissement": "School / Institution",
    "etablissement_placeholder": "e.g., Leclerc High School",
    "experience": "Years of experience",
    "experience_placeholder": "e.g., 5",
    "diplome": "Primary degree",
    "diplome_placeholder": "e.g., CAPES, Master's",
    "saving": "Saving...",
    "save_btn": "Save changes"
  },
  "settings": {
    "title": "Tutor Settings",
    "subtitle": "Customize your pedagogical workspace and notification preferences.",
    "success": "Tutor settings saved successfully!",
    "error": "Error during update.",
    "notif_title": "Review Notifications",
    "notif_desc": "Receive an email when the administration comments or validates your submissions.",
    "theme_title": "Interface Theme",
    "theme_placeholder": "Light Theme (Default)",
    "theme_clair": "Light Theme (Default)",
    "theme_sombre": "Dark Theme",
    "rythme_title": "Desired submission frequency",
    "rythme_placeholder": "Weekly (1 resource per week)",
    "rythme_occasionnel": "Occasional (1-2 resources per month)",
    "rythme_hebdomadaire": "Weekly (1 resource per week)",
    "rythme_intensif": "Intensive (Multiple resources per week)",
    "saving": "Saving...",
    "save_btn": "Save preferences"
  },
  "status": {
    "title": "Application Follow-up",
    "loading": "Loading status...",
    "no_application": "No application found",
    "no_application_desc": "You have not yet submitted an application to become a tutor.",
    "apply_btn": "Apply now",
    "label_candidate": "Candidate",
    "label_discipline": "Discipline",
    "label_date": "Submission date",
    "label_status": "Current status",
    "status_recu": "Received",
    "status_en_examen": "Under review",
    "status_test_requis": "Test required",
    "status_valide": "Validated",
    "status_active": "Account Activated",
    "status_refuse": "Declined",
    "status_pending": "Pending",
    "admin_message_title": "Message from administration:",
    "admin_message_default": "Your file is currently being analyzed by our pedagogical team.",
    "start_test_btn": "Start evaluation test",
    "access_space_btn": "Access my workspace",
    "back_home_btn": "Back to home"
  },
  "resources": {
    "title": "Pedagogical Resources",
    "subtitle": "Browse the catalog shared by LAURA's tutors and contributors.",
    "search_placeholder": "Search by title, subject...",
    "filter_placeholder": "Filter by type...",
    "all_types": "All types",
    "loading": "Loading resources...",
    "empty": "No resources found",
    "status_online": "✓ Online",
    "status_draft": "• Draft",
    "label_subject": "Subject:",
    "label_target": "Target:",
    "open_btn": "Open resource",
    "untitled": "Untitled",
    "general": "General"
  }
};

// Merge
fr.contribution_modal = contribution_modal_fr;
en.contribution_modal = contribution_modal_en;

fr.community = community_fr;
en.community = community_en;

// merge into learn.profile.form
if (fr.learn && fr.learn.profile && fr.learn.profile.form) {
  fr.learn.profile.form.matieres_title = "Mes matières à réviser";
  fr.learn.profile.form.matieres_subtitle = "Ajoutez les matières que vous étudiez. Ce sont elles qui composeront votre plan de révision.";
  fr.learn.profile.form.matiere_placeholder = "ex: Mathématiques, Physique-Chimie";
  fr.learn.profile.form.add_btn = "Ajouter";
  fr.learn.profile.form.no_matieres = "Aucune matière ajoutée. Veuillez en ajouter au moins une.";
}

if (en.learn && en.learn.profile && en.learn.profile.form) {
  en.learn.profile.form.matieres_title = "My subjects to review";
  en.learn.profile.form.matieres_subtitle = "Add the subjects you are studying. These will make up your revision plan.";
  en.learn.profile.form.matiere_placeholder = "e.g., Mathematics, Physics-Chemistry";
  en.learn.profile.form.add_btn = "Add";
  en.learn.profile.form.no_matieres = "No subjects added. Please add at least one.";
}

// merge into tutor keys (keep existing dashboard keys, overwrite other subkeys if any, or create objects)
fr.tutor = {
  ...fr.tutor,
  ...tutor_fr
};

en.tutor = {
  ...en.tutor,
  ...tutor_en
};

// Write files back
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');

console.log("Merged translations successfully!");
