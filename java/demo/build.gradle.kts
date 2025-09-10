plugins {
    id("org.springframework.boot") version "3.2.0"
    id("io.spring.dependency-management") version "1.1.4"
    java
}

group = "com.yagoutpay"
version = "0.1.0"

java {
    toolchain { languageVersion.set(JavaLanguageVersion.of(17)) }
}

repositories { mavenCentral() }

dependencies {
    implementation(project(":sdk"))
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("com.fasterxml.jackson.core:jackson-databind")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

tasks.bootRun {
    jvmArgs = listOf(
        "-Dcom.sun.net.ssl.checkRevocation=false",
        "-Dtrust_all_certificates=true",
        "-Dmaven.wagon.http.ssl.insecure=true",
        "-Dmaven.wagon.http.ssl.allowall=true"
    )
}


