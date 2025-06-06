package com.example.demo.service;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.example.demo.dto.email.EmailRequest;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.name}")
    private String fromName;

    /**
     * Send email using template
     */
    public void sendTemplateEmail(EmailRequest emailRequest) {
        try {
            String htmlContent = loadAndProcessTemplate(
                    emailRequest.getTemplateName(),
                    emailRequest.getTemplateData()
            );

            sendHtmlEmail(emailRequest.getTo(), emailRequest.getSubject(), htmlContent);

            log.info("Email sent successfully to: {}", emailRequest.getTo());
        } catch (IOException | MessagingException e) {
            log.error("Failed to send email to: {}", emailRequest.getTo(), e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    /**
     * Send simple HTML email
     */
    public void sendHtmlEmail(String to, String subject, String htmlContent)
            throws MessagingException, UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

        helper.setFrom(fromEmail, fromName);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(message);
    }

    /**
     * Load template from resources and replace placeholders
     */
    private String loadAndProcessTemplate(String templateName, Map<String, Object> templateData)
            throws IOException {

        String templatePath = "templates/email/" + templateName + ".html";
        ClassPathResource resource = new ClassPathResource(templatePath);

        if (!resource.exists()) {
            throw new IllegalArgumentException("Template not found: " + templatePath);
        }

        String content = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        // Replace placeholders with actual data
        if (templateData != null) {
            for (Map.Entry<String, Object> entry : templateData.entrySet()) {
                String placeholder = "{{" + entry.getKey() + "}}";
                String value = entry.getValue() != null ? entry.getValue().toString() : "";
                content = content.replace(placeholder, value);
            }
        }

        return content;
    }

    /**
     * Send project invitation email
     */
    public void sendProjectInvitation(String recipientEmail, String inviterName,
            String projectName, String projectDescription,
            String roleAssigned, String invitationLink,
            String expirationDate) {

        Map<String, Object> templateData = Map.of(
                "inviterName", inviterName,
                "projectName", projectName,
                "projectDescription", projectDescription,
                "roleAssigned", roleAssigned,
                "invitationLink", invitationLink,
                "expirationDate", expirationDate
        );

        EmailRequest emailRequest = EmailRequest.builder()
                .to(recipientEmail)
                .subject("Invitation au projet: " + projectName)
                .templateName("project-invitation")
                .templateData(templateData)
                .build();

        sendTemplateEmail(emailRequest);
    }

    /**
     * Send task assignment email
     */
    public void sendTaskAssignment(String recipientEmail, String assigneeName,
            String projectName, String taskName, String taskDescription,
            String dueDate, String priorityLevel, String priorityName,
            String assignedBy, String taskLink) {

        Map<String, Object> templateData = Map.of(
                "assigneeName", assigneeName,
                "projectName", projectName,
                "taskName", taskName,
                "taskDescription", taskDescription != null ? taskDescription : "Aucune description",
                "dueDate", dueDate != null ? dueDate : "Non définie",
                "priorityLevel", priorityLevel.toLowerCase(),
                "priorityName", priorityName,
                "assignedBy", assignedBy,
                "taskLink", taskLink
        );

        EmailRequest emailRequest = EmailRequest.builder()
                .to(recipientEmail)
                .subject("Nouvelle tâche assignée: " + taskName)
                .templateName("task-assignment")
                .templateData(templateData)
                .build();

        sendTemplateEmail(emailRequest);
    }

    /**
     * Send smart project invitation email (detects if user exists)
     */
    public void sendProjectInvitationSmart(String recipientEmail, String inviterName,
            String projectName, String projectDescription,
            String roleAssigned, String invitationToken,
            boolean userExists, String baseUrl) {

        String invitationLink = userExists
                ? baseUrl + "/invitations/accept/" + invitationToken
                : baseUrl + "/invitations/accept/" + invitationToken + "?needsAccount=true";

        String templateName = userExists ? "project-invitation-existing" : "project-invitation-new";

        Map<String, Object> templateData = Map.of(
                "inviterName", inviterName,
                "projectName", projectName,
                "projectDescription", projectDescription != null ? projectDescription : "Aucune description disponible",
                "roleAssigned", roleAssigned,
                "invitationLink", invitationLink,
                "invitationToken", invitationToken,
                "loginLink", baseUrl + "/login?redirectTo=" + java.net.URLEncoder.encode("/invitations/accept/" + invitationToken, java.nio.charset.StandardCharsets.UTF_8),
                "registerLink", baseUrl + "/register?redirectTo=" + java.net.URLEncoder.encode("/invitations/accept/" + invitationToken, java.nio.charset.StandardCharsets.UTF_8),
                "userExists", userExists
        );

        String subject = userExists
                ? "Invitation au projet: " + projectName
                : "Créez votre compte et rejoignez le projet: " + projectName;

        EmailRequest emailRequest = EmailRequest.builder()
                .to(recipientEmail)
                .subject(subject)
                .templateName(templateName)
                .templateData(templateData)
                .build();

        sendTemplateEmail(emailRequest);
    }
}
