
Before reading from a pin, a GPIO pin needs to be exported:
```C
int gpio_export(int gpio)
{
    char dir[80];
    snprintf(dir, sizeof(dir), GPIO_ROOT "/gpio%d", gpio);
    if (access(dir, F_OK) == 0) return 0;   /* already exported */

    char buf[16];
    snprintf(buf, sizeof(buf), "%d", gpio);
    if (sysfs_write(GPIO_ROOT "/export", buf) < 0) {
        fprintf(stderr, "  [!] Export failed — is gpio%d valid on this kernel?\n", gpio);
        return -1;
    }
    return 0;
}
```

 ` snprintf` writes data into char array `buf`. This is necessary because the way you read GPIO pins in a Linux based development board is through accessing the GPIO file.

After the pin is exported, it is read through:
```C
int gpio_read(int gpio)
{
    char path[80];
    snprintf(path, sizeof(path), GPIO_ROOT "/gpio%d/value", gpio);
    FILE *f = fopen(path, "r");
    if (!f) { perror("  [!] read value"); return -1; }
    
    int v = -1;
    fscanf(f, "%d", &v);
    fclose(f);
    return v;
}
```

taking the output of `/gpio%d/value` as a file and returning it as a value