plugins {
    application
}

group = "com.yagoutpay"
version = "0.1.0"

application {
    mainClass.set("com.yagoutpay.demo.Main")
}

java {
    toolchain { languageVersion.set(JavaLanguageVersion.of(17)) }
}

repositories { mavenCentral() }

dependencies {
    implementation(project(":sdk"))
    implementation("io.javalin:javalin:6.1.6")
    implementation("org.slf4j:slf4j-simple:2.0.13")
}


