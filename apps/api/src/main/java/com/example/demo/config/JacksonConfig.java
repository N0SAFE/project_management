package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.hibernate5.jakarta.Hibernate5JakartaModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        // Register the JavaTimeModule for Java 8 date/time support
        mapper.registerModule(new JavaTimeModule());
        
        // Register Hibernate module to handle lazy loading and proxies
        Hibernate5JakartaModule hibernateModule = new Hibernate5JakartaModule();
        hibernateModule.disable(Hibernate5JakartaModule.Feature.USE_TRANSIENT_ANNOTATION);
        hibernateModule.enable(Hibernate5JakartaModule.Feature.FORCE_LAZY_LOADING);
        hibernateModule.enable(Hibernate5JakartaModule.Feature.SERIALIZE_IDENTIFIER_FOR_LAZY_NOT_LOADED_OBJECTS);
        
        mapper.registerModule(hibernateModule);
        
        // Disable writing dates as timestamps (write as ISO strings instead)
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        // Don't fail on empty beans
        mapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
        
        return mapper;
    }
}
