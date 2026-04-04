from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("properties", "0001_initial"),
    ]

    operations = [
        # Rename models
        migrations.RenameModel(
            old_name="Property",
            new_name="Shortlet",
        ),
        migrations.RenameModel(
            old_name="PropertyImage",
            new_name="ShortletImage",
        ),
        # Rename fields
        migrations.RenameField(
            model_name="shortlet",
            old_name="property_type",
            new_name="shortlet_type",
        ),
        migrations.RenameField(
            model_name="shortletimage",
            old_name="property",
            new_name="shortlet",
        ),
        # Update meta
        migrations.AlterModelOptions(
            name="shortlet",
            options={"ordering": ["-created_at"], "verbose_name_plural": "shortlets"},
        ),
    ]
