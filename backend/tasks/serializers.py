from rest_framework import serializers

class TaskSerializers(serializers.Serializer):
    title=serializers.CharField()
    due_date=serializers.DateField(required=False,allow_null=True)
    estimated_hours=serializers.FloatField(required=False,default=1)
    importance=serializers.IntegerField(required=False,default=5)
    dependencies=serializers.ListField(child=serializers.charField(),required=False,default=list)

    #respnse fields
    score=serializers.FloatField(required=False)
    explanation=serializers.CharField(required=False)