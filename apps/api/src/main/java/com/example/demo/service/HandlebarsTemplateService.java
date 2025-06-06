package com.example.demo.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.github.jknack.handlebars.Handlebars;
import com.github.jknack.handlebars.Template;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class HandlebarsTemplateService {

    private final Handlebars handlebars;

    public HandlebarsTemplateService() {
        this.handlebars = new Handlebars();
        
        // Register custom helpers
        registerHelpers();
    }

    /**
     * Process template with Handlebars
     */
    public String processTemplate(String templateName, Map<String, Object> templateData) {
        try {
            String templateContent = loadTemplateContent(templateName);
            Template template = handlebars.compileInline(templateContent);
            return template.apply(templateData);
        } catch (IOException e) {
            log.error("Failed to process template: {}", templateName, e);
            throw new RuntimeException("Failed to process template: " + templateName, e);
        }
    }

    /**
     * Load template content from resources
     */
    private String loadTemplateContent(String templateName) throws IOException {
        String templatePath = "templates/email/" + templateName + ".html";
        ClassPathResource resource = new ClassPathResource(templatePath);

        if (!resource.exists()) {
            throw new IllegalArgumentException("Template not found: " + templatePath);
        }

        return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
    }

    /**
     * Register custom Handlebars helpers
     */
    private void registerHelpers() {
        // Equality helper for conditional logic
        handlebars.registerHelper("eq", (context, options) -> {
            Object param1 = context;
            Object param2 = options.param(0);
            
            if (param1 == null && param2 == null) {
                return options.fn();
            }
            
            if (param1 != null && param1.equals(param2)) {
                return options.fn();
            }
            
            return options.inverse();
        });

        // Not equal helper
        handlebars.registerHelper("ne", (context, options) -> {
            Object param1 = context;
            Object param2 = options.param(0);
            
            if (param1 == null && param2 == null) {
                return options.inverse();
            }
            
            if (param1 != null && param1.equals(param2)) {
                return options.inverse();
            }
            
            return options.fn();
        });

        // Format date helper (if needed)
        handlebars.registerHelper("formatDate", (context, options) -> {
            // Implementation for date formatting if needed
            return context != null ? context.toString() : "";
        });

        // Uppercase helper
        handlebars.registerHelper("upper", (context, options) -> {
            return context != null ? context.toString().toUpperCase() : "";
        });

        // Lowercase helper
        handlebars.registerHelper("lower", (context, options) -> {
            return context != null ? context.toString().toLowerCase() : "";
        });
    }
}
